from app.services.rag.retriever import RAGRetriever
from app.services.rag.schema import Rule, RuleSource
import json

def seed():
    retriever = RAGRetriever()
    
    rules = [
        Rule(
            rule_id="Ohms_001",
            rule_name="Ohm's Law (Time Domain)",
            category="Linear Circuit Theory",
            domain="Lumped Parameter Circuits",
            formal_definition="The current through a conductor between two points is directly proportional to the voltage across the two points.",
            applicability_conditions=[
                "Linear material",
                "Constant temperature",
                "Lumped parameter regime"
            ],
            governing_equations=[
                "v(t) = i(t) * R"
            ],
            constraints=[
                "Not applicable to non-linear devices (diodes)",
                "Fails at very high frequencies (skin effect)"
            ],
            source=RuleSource(title="Fundamentals of Electric Circuits", author="Alexander & Sadiku", section="2.2"),
            embedding_text="ohm's law voltage current resistance resistor linear circuit v=ir"
        ),
        Rule(
            rule_id="KVL_001",
            rule_name="Kirchhoff's Voltage Law",
            category="Linear Circuit Theory",
            domain="Lumped Parameter Circuits",
            formal_definition="The algebraic sum of all voltages around a closed loop (or mesh) is zero.",
            applicability_conditions=[
                "Lumped parameter regime",
                "Conservative field (no time-varying magnetic flux through loop area)"
            ],
            governing_equations=[
                "Sum(v_drop) = Sum(v_rise)"
            ],
            constraints=[
                "Violation in presence of changing magnetic fields (Faraday's Law)"
            ],
            source=RuleSource(title="Fundamentals of Electric Circuits", author="Alexander & Sadiku", section="2.4"),
            embedding_text="KVL kirchhoff voltage law loop mesh analysis sum zero"
        )
    ]
    
    print(f"Seeding {len(rules)} rules...")
    retriever.add_rules(rules)
    print("Seeding Complete.")

if __name__ == "__main__":
    seed()
