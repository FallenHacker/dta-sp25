import { render, screen } from '@testing-library/react';
import App from './App';

test('renders input field', () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText(/Enter text here/i);
  expect(inputElement).toBeInTheDocument();
});
