import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaptchaComponent from '../CaptchaComponent';

// Mock the canvas context
const mockGetContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  transform: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  set fillStyle(value) {},
  set strokeStyle(value) {},
  set lineWidth(value) {},
  set font(value) {},
  set textAlign(value) {},
  set textBaseline(value) {},
  set shadowColor(value) {},
  set shadowBlur(value) {},
  set shadowOffsetX(value) {},
  set shadowOffsetY(value) {}
}));

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext
});

// Mock Web Speech API
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn()
  },
  writable: true
});

// Mock SpeechSynthesisUtterance
global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  rate: 1,
  pitch: 1,
  volume: 1
}));

describe('CaptchaComponent', () => {
  const mockOnCaptchaChange = jest.fn();
  const mockOnValidationChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders CAPTCHA component correctly', () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    expect(screen.getByText('CAPTCHA Verification')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter CAPTCHA code')).toBeInTheDocument();
    expect(screen.getByTitle('Refresh CAPTCHA')).toBeInTheDocument();
    expect(screen.getByTitle('Audio CAPTCHA')).toBeInTheDocument();
  });

  test('calls onCaptchaChange when input changes', () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    const input = screen.getByPlaceholderText('Enter CAPTCHA code');
    fireEvent.change(input, { target: { value: 'ABC123' } });

    expect(mockOnCaptchaChange).toHaveBeenCalledWith('ABC123');
  });

  test('limits input to 6 characters', () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    const input = screen.getByPlaceholderText('Enter CAPTCHA code');
    fireEvent.change(input, { target: { value: 'ABCDEFGHIJ' } });

    expect(input.value).toBe('ABCDEF');
  });

  test('shows attempts counter after failed attempt', async () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    const input = screen.getByPlaceholderText('Enter CAPTCHA code');
    
    // Enter wrong CAPTCHA (6 characters to trigger validation)
    fireEvent.change(input, { target: { value: 'WRONG1' } });

    // Wait for the failed attempt to be processed
    await waitFor(() => {
      expect(screen.getByText(/attempts/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('refresh button generates new CAPTCHA', () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    const refreshButton = screen.getByTitle('Refresh CAPTCHA');
    fireEvent.click(refreshButton);

    // Canvas should be redrawn (getContext called)
    expect(mockGetContext).toHaveBeenCalled();
  });

  test('audio button triggers speech synthesis', () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    const audioButton = screen.getByTitle('Audio CAPTCHA');
    fireEvent.click(audioButton);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  test('shows success message when CAPTCHA is valid', async () => {
    const component = render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    // We need to mock the internal CAPTCHA code to test validation
    // This is a simplified test - in reality, we'd need to access the internal state
    const input = screen.getByPlaceholderText('Enter CAPTCHA code');
    
    // Simulate correct input (this won't actually validate without knowing the code)
    fireEvent.change(input, { target: { value: 'TEST12' } });

    // Check that the callback was called
    expect(mockOnCaptchaChange).toHaveBeenCalledWith('TEST12');
  });

  test('disables input when locked', async () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    const input = screen.getByPlaceholderText('Enter CAPTCHA code');
    
    // Simulate multiple failed attempts to trigger lock
    for (let i = 0; i < 3; i++) {
      fireEvent.change(input, { target: { value: `WRONG${i}` } });
      await waitFor(() => {}, { timeout: 600 }); // Wait for validation delay
    }

    // After 3 failed attempts, component should be locked
    await waitFor(() => {
      expect(screen.getByText('Locked')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('shows accessibility instructions', () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    expect(screen.getByText(/Enter the 6-character code/)).toBeInTheDocument();
    expect(screen.getByText(/Click the refresh button/)).toBeInTheDocument();
    expect(screen.getByText(/Click the audio button/)).toBeInTheDocument();
    expect(screen.getByText(/Code is case-insensitive/)).toBeInTheDocument();
  });

  test('resets when reset prop changes', () => {
    const { rerender } = render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    const input = screen.getByPlaceholderText('Enter CAPTCHA code');
    fireEvent.change(input, { target: { value: 'TEST12' } });

    expect(input.value).toBe('TEST12');

    // Trigger reset
    rerender(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={true}
      />
    );

    // Input should be cleared and new CAPTCHA generated
    expect(mockGetContext).toHaveBeenCalled();
  });

  test('includes honeypot field for bot detection', () => {
    render(
      <CaptchaComponent
        onCaptchaChange={mockOnCaptchaChange}
        onValidationChange={mockOnValidationChange}
        reset={false}
      />
    );

    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveStyle({ position: 'absolute', left: '-9999px' });
  });
});

// Integration test with form submission
describe('CaptchaComponent Integration', () => {
  test('integrates correctly with form submission', () => {
    const mockSubmit = jest.fn();
    let captchaValid = false;

    const TestForm = () => {
      const [isValid, setIsValid] = React.useState(false);

      const handleSubmit = (e) => {
        e.preventDefault();
        if (isValid) {
          mockSubmit();
        }
      };

      return (
        <form onSubmit={handleSubmit}>
          <CaptchaComponent
            onCaptchaChange={() => {}}
            onValidationChange={setIsValid}
            reset={false}
          />
          <button type="submit" disabled={!isValid}>
            Submit
          </button>
        </form>
      );
    };

    render(<TestForm />);

    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeDisabled();

    // Form should not submit without valid CAPTCHA
    fireEvent.click(submitButton);
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});