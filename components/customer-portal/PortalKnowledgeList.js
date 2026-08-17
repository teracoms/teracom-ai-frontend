// Objective #11 — self-service knowledge access. Only Knowledge rows an
// admin has explicitly marked customer_visible=true.
export default function PortalKnowledgeList({ articles }) {
  if (articles.length === 0) {
    return <p className="activity-meta">No knowledge articles available yet.</p>;
  }

  return (
    <ul className="activity-list">
      {articles.map((article) => (
        <li key={article.id}>
          <p className="activity-title">{article.title}</p>
          <p className="activity-meta">{article.content}</p>
        </li>
      ))}
    </ul>
  );
}
