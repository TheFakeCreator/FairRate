import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  it('renders the FairRate title', () => {
    render(<Sidebar activeTab="dashboard" setActiveTab={() => {}} />);
    expect(screen.getByText('FairRate')).toBeInTheDocument();
  });

  it('shows sign in button when user is null', () => {
    render(<Sidebar activeTab="dashboard" setActiveTab={() => {}} user={null} />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('shows user email when user is provided', () => {
    const mockUser = { name: 'Test User', email: 'test@example.com' };
    render(<Sidebar activeTab="dashboard" setActiveTab={() => {}} user={mockUser} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});
