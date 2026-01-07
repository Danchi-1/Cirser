from app.services.rag.retriever import RAGRetriever
from app.schemas.rule import Rule, RuleSource
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
        ),
        Rule(
            rule_id="BRIDGE_T_DELTA_WYE",
            rule_name="Bridge-T to T-Network Transformation",
            category="Two-Port Network Analysis",
            domain="Linear Circuit Theory",
            formal_definition="A Bridge-T network (with bridge Z4 across series Z1, Z2) can be analyzed by converting the Delta (Z1, Z2, Z4) into an equivalent Wye (Za, Zb, Zc) to form a simple T-Network.",
            applicability_conditions=[
                "Bridge impedance Z4 connects input node to output node directly",
                "Shunt impedance Z3 connects center node to ground",
                "Linear, time-invariant components"
            ],
            governing_equations=[
                "Za = (Z1*Z4) / (Z1+Z2+Z4)",
                "Zb = (Z2*Z4) / (Z1+Z2+Z4)",
                "Zc = (Z1*Z2) / (Z1+Z2+Z4)",
                "Z_shunt = Zc + Z3"
            ],
            constraints=[
                "Valid only if Z4 bridges the top nodes of Z1 and Z2"
            ],
            source=RuleSource(title="Network Analysis", author="Van Valkenburg", section="11.4"),
            embedding_text="bridge-t network delta wye conversion ABCD parameters two-port z-parameters t-network transformation"
        ),
        Rule(
            rule_id="T_NETWORK_GENERIC",
            rule_name="T-Network Analysis (Z-Parameters)",
            category="Two-Port Network Analysis",
            domain="Linear Circuit Theory",
            formal_definition="A T-Network consists of two series impedances (Z1, Z2) and one shunt impedance (Z3) connected to a common ground.",
            applicability_conditions=[
                "Three-terminal network",
                "Star/Wye configuration",
                "Z3 provides path to ground"
            ],
            governing_equations=[
                "Z11 = Z1 + Z3",
                "Z12 = Z3",
                "Z21 = Z3",
                "Z22 = Z2 + Z3",
                "A = 1 + Z1/Z3",
                "B = Z1 + Z2 + (Z1*Z2)/Z3",
                "C = 1/Z3",
                "D = 1 + Z2/Z3"
            ],
            constraints=["Passive components"],
            source=RuleSource(title="Microwave Engineering", author="Pozar", section="4.2"),
            embedding_text="t-network tee network z-parameters abcd parameters transmission parameters input impedance"
        ),
        Rule(
            rule_id="PI_NETWORK_GENERIC",
            rule_name="Pi-Network Analysis (Y-Parameters)",
            category="Two-Port Network Analysis",
            domain="Linear Circuit Theory",
            formal_definition="A Pi-Network consists of one series impedance (Z2) and two shunt impedances (Z1 at input, Z3 at output).",
            applicability_conditions=[
                "Three-terminal network",
                "Delta/Pi configuration",
                "Shunt arms at both ports"
            ],
            governing_equations=[
                "Y11 = (1/Z1) + (1/Z2)",
                "Y12 = -1/Z2",
                "Y21 = -1/Z2",
                "Y22 = (1/Z3) + (1/Z2)",
                "A = 1 + Z2/Z3",
                "B = Z2",
                "C = (1/Z1) + (1/Z3) + (Z2/(Z1*Z3))",
                "D = 1 + Z2/Z1"
            ],
            constraints=["Passive components"],
            source=RuleSource(title="Microwave Engineering", author="Pozar", section="4.2"),
            embedding_text="pi-network pi filter y-parameters admittance parameters abcd parameters"
        )
    ]
    
    print(f"Seeding {len(rules)} rules...")
    retriever.add_rules(rules)
    print("Seeding Complete.")

if __name__ == "__main__":
    seed()
