import chromadb
from chromadb.utils import embedding_functions
from app.core.config import settings
from app.services.rag.schema import Rule, RuleSearchResult, RuleSource
import json

class RAGRetriever:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST, 
            port=settings.CHROMA_PORT
        )
        self.collection_name = "cirser_rules"
        # Using default embedding function for now (SentenceTransformers)
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction() 
        
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name, 
            embedding_function=self.embedding_fn
        )

    def add_rules(self, rules: list[Rule]):
        ids = [r.rule_id for r in rules]
        documents = [r.embedding_text for r in rules]
        metadatas = [r.model_dump(exclude={"embedding_text"}) for r in rules]
        
        # Serialize nested dicts for Chroma compatibility if needed
        # But Chroma handles standard JSON metadatas reasonably well usually.
        # Ideally we flatten or store pure JSON string.
        formatted_metadatas = []
        for m in metadatas:
            # Flatten or strict type conversion
            clean_m = {}
            for k, v in m.items():
                if isinstance(v, (dict, list)):
                    clean_m[k] = json.dumps(v)
                else:
                    clean_m[k] = v
            formatted_metadatas.append(clean_m)

        self.collection.add(
            ids=ids,
            documents=documents,
            metadatas=formatted_metadatas
        )

    def search(self, query: str, n_results: int = 5) -> list[RuleSearchResult]:
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        candidates = []
        if results['ids']:
            ids = results['ids'][0]
            distances = results['distances'][0]
            metadatas = results['metadatas'][0]
            
            for i, rule_id in enumerate(ids):
                # Deserialization from metadata
                meta = metadatas[i]
                rule_data = {
                    "rule_id": rule_id,
                    "rule_name": meta.get("rule_name"),
                    "category": meta.get("category"),
                    "domain": meta.get("domain"),
                    "formal_definition": meta.get("formal_definition"),
                    "applicability_conditions": json.loads(meta.get("applicability_conditions")),
                    "governing_equations": json.loads(meta.get("governing_equations")),
                    "constraints": json.loads(meta.get("constraints")),
                    "source": json.loads(meta.get("source")),
                    "embedding_text": "" # Not strictly needed in result
                }
                
                rule = Rule(**rule_data)
                # Cosine distance to similarity (approximate)
                similarity = 1 - distances[i] 
                
                candidates.append(RuleSearchResult(rule=rule, similarity_score=similarity))
                
        return candidates
