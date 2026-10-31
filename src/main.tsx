import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <main>
        <h1>Farm Helper</h1>
        <p>Read-only profitability guidance is being prepared.</p>
      </main>
    </StrictMode>,
  );
}
