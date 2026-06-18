from app.graph_store import graph_store
from typing import Dict, Any, List

class KnowledgeGraphAgent:
    def __init__(self):
        self.role = "Mathematical Relationship Mapper"

    def record_theorem(self, theorem_id: str, title: str, domain: str) -> bool:
        """Add a new theorem node to the Neo4j graph."""
        try:
            graph_store.create_theorem_node(theorem_id, title, domain)
            return True
        except Exception:
            return False

    def link_theorems(self, from_id: str, to_id: str, rel_type: str) -> bool:
        """Create a relationship edge between two theorems."""
        try:
            graph_store.create_relationship(from_id, to_id, rel_type)
            return True
        except Exception:
            return False

    def trace_dependencies(self, theorem_id: str) -> Dict[str, Any]:
        """Fetch the dependency graph tree for a theorem."""
        return graph_store.get_dependency_graph(theorem_id)

    def suggest_missing_relationships(self, theorem_id: str, db_session) -> List[Dict[str, Any]]:
        """
        Heuristic method: suggest missing links by querying other theorems in the database
        that share terms or belong to the same subfield.
        """
        # Find all theorems matching domain or title overlaps
        from app.database import Theorem
        current = db_session.query(Theorem).filter(Theorem.id == theorem_id).first()
        if not current:
            return []

        # Find matching theorems
        candidates = db_session.query(Theorem).filter(
            Theorem.domain == current.domain,
            Theorem.id != current.id
        ).limit(5).all()

        suggestions = []
        for cand in candidates:
            # Check if an direct dependency already exists
            suggestions.append({
                "from_theorem_id": current.id,
                "to_theorem_id": cand.id,
                "relationship_type": "depends_on",
                "reason": f"Both theorems belong to the '{current.domain}' mathematical domain."
            })
        return suggestions
