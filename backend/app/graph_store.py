from neo4j import GraphDatabase
from app.config import settings

class MathGraphStore:
    def __init__(self):
        self.driver = None
        if settings.NEO4J_URI:
            try:
                self.driver = GraphDatabase.driver(
                    settings.NEO4J_URI, 
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
                )
            except Exception:
                self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def create_theorem_node(self, theorem_id: str, title: str, domain: str):
        if not self.driver:
            return
        try:
            query = """
            MERGE (t:Theorem {id: $theorem_id})
            SET t.title = $title, t.domain = $domain
            RETURN t
            """
            with self.driver.session() as session:
                session.run(query, theorem_id=theorem_id, title=title, domain=domain)
        except Exception:
            pass

    def create_relationship(self, from_id: str, to_id: str, rel_type: str):
        if not self.driver:
            return
        # Sanitize rel_type to match standard cypher parameters or construct string
        # Supported: implies, depends_on, extends, generalizes, contradicts
        valid_rels = ["implies", "depends_on", "extends", "generalizes", "contradicts"]
        if rel_type not in valid_rels:
            raise ValueError(f"Invalid relationship type: {rel_type}")

        try:
            query = f"""
            MATCH (a:Theorem {{id: $from_id}})
            MATCH (b:Theorem {{id: $to_id}})
            MERGE (a)-[r:{rel_type.upper()}]->(b)
            RETURN r
            """
            with self.driver.session() as session:
                session.run(query, from_id=from_id, to_id=to_id)
        except Exception:
            pass

    def get_dependency_graph(self, theorem_id: str):
        if not self.driver:
            # Fallback mock graph structure if database is down
            return {
                "nodes": [{"id": theorem_id, "label": theorem_id, "type": "Theorem"}],
                "edges": []
            }
        
        # Cypher query to retrieve dependencies recursively (up to depth 3)
        query = """
        MATCH path = (t:Theorem {id: $theorem_id})-[:DEPENDS_ON|IMPLIES*1..3]->(dep:Theorem)
        RETURN path
        """
        
        nodes = {}
        edges = []
        
        try:
            with self.driver.session() as session:
                result = session.run(query, theorem_id=theorem_id)
                for record in result:
                    path = record["path"]
                    for node in path.nodes:
                        nid = node["id"]
                        nodes[nid] = {
                            "id": nid,
                            "label": node.get("title", nid),
                            "type": list(node.labels)[0] if node.labels else "Theorem",
                            "domain": node.get("domain", "General")
                        }
                    for rel in path.relationships:
                        edges.append({
                            "source": rel.nodes[0]["id"],
                            "target": rel.nodes[1]["id"],
                            "type": rel.type
                        })
        except Exception:
            pass

        # If empty (no relations), at least return the self node
        if not nodes:
            nodes[theorem_id] = {"id": theorem_id, "label": theorem_id, "type": "Theorem", "domain": "General"}

        return {
            "nodes": list(nodes.values()),
            "edges": edges
        }

    def clear_graph(self):
        if not self.driver:
            return
        try:
            query = "MATCH (n) DETACH DELETE n"
            with self.driver.session() as session:
                session.run(query)
        except Exception:
            pass

graph_store = MathGraphStore()
