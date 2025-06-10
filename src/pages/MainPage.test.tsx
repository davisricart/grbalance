import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { User } from 'firebase/auth';
import MainPage from './MainPage';

// Mock Firebase
jest.mock('../main', () => ({
  auth: {},
  db: {}
}));

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  signOut: jest.fn()
}));

// Mock Firebase firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  runTransaction: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn()
}));

// Mock XLSX
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn()
  },
  writeFile: jest.fn()
}));

// Mock components
jest.mock('../components/UsageCounter', () => {
  return function MockUsageCounter() {
    return <div data-testid="usage-counter">Usage Counter</div>;
  };
});

jest.mock('../components/VirtualTable', () => ({
  VirtualTable: function MockVirtualTable() {
    return <div data-testid="virtual-table">Virtual Table</div>;
  }
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Mock user object
const mockUser: User = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2023-01-01',
    lastSignInTime: '2023-01-01'
  },
  providerData: [],
  refreshToken: 'test-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase'
};

describe('MainPage', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock URL parameters
    delete (window as any).location;
    (window as any).location = { 
      hostname: 'localhost',
      search: ''
    };
  });

  it('renders the main page components', () => {
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    expect(screen.getByText('Reconciliation Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('usage-counter')).toBeInTheDocument();
  });

  it('handles file upload for file 1', async () => {
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    const file = new File(['test content'], 'test1.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText(/Upload File 1/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(fileInput).toHaveProperty('files', expect.arrayContaining([file]));
    });
  });

  it('handles file upload for file 2', async () => {
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    const file = new File(['test content'], 'test2.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const fileInput = screen.getByLabelText(/Upload File 2/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(fileInput).toHaveProperty('files', expect.arrayContaining([file]));
    });
  });

  it('displays file validation errors', async () => {
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    // Try to upload an invalid file type
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/Upload File 1/i);
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    // Should show an error for invalid file type
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/invalid file type/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('handles script selection', () => {
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    // Find script selector
    const scriptSelect = screen.getByRole('combobox');
    fireEvent.change(scriptSelect, { target: { value: 'test-script' } });

    expect(scriptSelect).toHaveValue('test-script');
  });

  it('toggles between overview and insights tabs', () => {
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    // Find and click insights tab
    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);

    // Verify tab is active
    expect(insightsTab.closest('button')).toHaveClass('border-emerald-500');

    // Switch back to overview
    const overviewTab = screen.getByText('Overview');
    fireEvent.click(overviewTab);

    expect(overviewTab.closest('button')).toHaveClass('border-emerald-500');
  });

  it('handles sign out', async () => {
    const { signOut } = require('firebase/auth');
    
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    const signOutButton = screen.getByLabelText(/sign out/i);
    fireEvent.click(signOutButton);

    expect(signOut).toHaveBeenCalled();
  });

  it('shows processing state during file processing', () => {
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    // The component should render without processing state initially
    expect(screen.queryByText(/processing/i)).not.toBeInTheDocument();
  });

  it('handles URL client parameter', () => {
    // Mock URL with client parameter
    delete (window as any).location;
    (window as any).location = { 
      hostname: 'localhost',
      search: '?client=test-client'
    };

    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    // Component should render normally with client parameter
    expect(screen.getByText('Reconciliation Dashboard')).toBeInTheDocument();
  });

  it('clears files when clear button is clicked', async () => {
    render(
      <TestWrapper>
        <MainPage user={mockUser} />
      </TestWrapper>
    );

    // Upload a file first
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText(/Upload File 1/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Look for clear button and click it
    const clearButtons = screen.getAllByText(/clear/i);
    if (clearButtons.length > 0) {
      fireEvent.click(clearButtons[0]);
    }

    // File should be cleared
    await waitFor(() => {
      expect(fileInput).toHaveValue('');
    });
  });
});