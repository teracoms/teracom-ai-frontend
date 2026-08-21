export default function WorkerChatLoading() {
  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">Chat</span>
            <h1>Loading worker...</h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="chat-thread skeleton" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
