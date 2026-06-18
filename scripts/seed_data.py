import sys
import os

# Adjust path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from app.database import init_db, SessionLocal, User, Project, Theorem, Proof, Conjecture
from app.auth import get_password_hash
from app.vector_store import vector_store
from app.graph_store import graph_store

def seed():
    print("Initializing Database Schema...")
    init_db()
    
    db = SessionLocal()
    try:
        # Check if test user exists
        user = db.query(User).filter(User.email == "scientist@mathgpt.io").first()
        if not user:
            print("Seeding test user account...")
            hashed = get_password_hash("quantum_field_theory_9988")
            user = User(
                email="scientist@mathgpt.io",
                hashed_password=hashed,
                full_name="Edward Witten",
                role="researcher"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Check if project exists
        project = db.query(Project).filter(Project.name == "Quantum Geometry Proving").first()
        if not project:
            print("Seeding project workspace...")
            project = Project(
                name="Quantum Geometry Proving",
                description="Verifying gauge theory transformations formally in Lean4.",
                owner_id=user.id
            )
            project.members.append(user)
            db.add(project)
            db.commit()
            db.refresh(project)

        # Seed initial Theorems
        theorems_data = [
            {
                "id": "thm_pythagoras",
                "title": "Pythagorean Theorem",
                "statement": "a^2 + b^2 = c^2 for right triangles",
                "formal_statement_lean": "∀ a b c : Real, a^2 + b^2 = c^2",
                "domain": "Algebra"
            },
            {
                "id": "thm_euler_identity",
                "title": "Euler's Identity",
                "statement": "e^{i\\pi} + 1 = 0",
                "formal_statement_lean": "exp (I * pi) + 1 = 0",
                "domain": "Algebra"
            },
            {
                "id": "thm_fermat_last",
                "title": "Fermat's Last Theorem",
                "statement": "x^n + y^n = z^n has no non-zero integer solutions for n >= 3",
                "formal_statement_lean": "∀ n : Nat, n >= 3 → ∀ x y z : Nat, x^n + y^n = z^n → x = 0 ∨ y = 0",
                "domain": "Number Theory"
            }
        ]

        for thm in theorems_data:
            exists = db.query(Theorem).filter(Theorem.id == thm["id"]).first()
            if not exists:
                print(f"Seeding Theorem: {thm['title']}...")
                new_thm = Theorem(
                    id=thm["id"],
                    title=thm["title"],
                    statement=thm["statement"],
                    formal_statement_lean=thm["formal_statement_lean"],
                    domain=thm["domain"],
                    project_id=project.id,
                    status="unproven"
                )
                db.add(new_thm)
                db.commit()
                
                # Seed Qdrant Vector
                vector_store.upsert_theorem(
                    theorem_id=thm["id"],
                    title=thm["title"],
                    statement=thm["statement"],
                    domain=thm["domain"],
                    project_id=project.id
                )

                # Seed Neo4j node
                graph_store.create_theorem_node(thm["id"], thm["title"], thm["domain"])

        # Link relationship in Graph Store (Fermat depends on Pythagoras for some sub-lemmas)
        graph_store.create_relationship("thm_fermat_last", "thm_pythagoras", "depends_on")

        # Seed mock conjecture
        exists_conj = db.query(Conjecture).filter(Conjecture.title == "Goldbach Conjecture").first()
        if not exists_conj:
            print("Seeding Goldbach Conjecture candidate...")
            conjecture = Conjecture(
                title="Goldbach Conjecture",
                statement="Every even integer greater than 2 is the sum of two primes.",
                symbolic_representation="∀ n : Nat, Even n ∧ n > 2 → IsPrime p ∧ IsPrime q ∧ p + q = n",
                domain="Number Theory",
                confidence_score=0.95,
                support_evidence="Checked numerically up to 4 * 10^18.",
                status="candidate",
                project_id=project.id
            )
            db.add(conjecture)
            db.commit()

        print("Dataset Seeding Completed successfully.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
