export default function Loading() {
  return (
    <main>
      <div className="page-shell">
        <section className="match-card" aria-busy="true" aria-live="polite">
          <h1>Loading featured match</h1>
          <p>Checking the latest validated fixture and stored prediction.</p>
        </section>
      </div>
    </main>
  );
}
