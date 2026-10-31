import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CalculatorApp } from './presentation/features/calculator/CalculatorApp';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <CalculatorApp />
    </StrictMode>,
  );
}
