import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LoginPage from "../LoginPage";
import { AuthProvider } from "@/contexts/AuthContext";

const { mockLogin } = vi.hoisted(() => ({ mockLogin: vi.fn() }));

vi.mock("@/services/api", () => ({
  login: mockLogin,
  register: vi.fn(),
}));

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <LoginPage />
        <LocationDisplay />
      </AuthProvider>
    </MemoryRouter>
  );
}

function submitForm() {
  fireEvent.submit(document.querySelector("form")!);
}

beforeEach(() => {
  mockLogin.mockReset();
  localStorage.clear();
});

afterEach(cleanup);

describe("LoginPage", () => {
  it("renders the login form with title, inputs, and submit button", () => {
    renderLoginPage();

    expect(screen.getByText("Bienvenido de nuevo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("usuario123")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByText("Entrar")).toBeInTheDocument();
  });

  it("shows validation error when username is empty on submit", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByPlaceholderText("usuario123"));
    submitForm();

    expect(screen.getByText("El usuario o correo es obligatorio")).toBeInTheDocument();
  });

  it("shows validation error when password is empty after filling username", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("usuario123"), "testuser");
    submitForm();

    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
  });

  it("shows validation error when username looks like an email but is invalid", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("usuario123"), "invalid@@email");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    submitForm();

    expect(
      screen.getByText("El correo electrónico no tiene un formato válido")
    ).toBeInTheDocument();
  });

  it("calls login API and navigates to /dashboard on success", async () => {
    const fakeUser = {
      id: 1,
      email: "test@test.com",
      name: "Test",
      surname: "User",
      user_name: "testuser",
    };
    mockLogin.mockResolvedValue({ token: "fake-jwt-token", user: fakeUser });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("usuario123"), "testuser");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    submitForm();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("testuser", "password123");
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
    });
  });

  it("stores JWT token in localStorage after successful login", async () => {
    const fakeUser = {
      id: 1,
      email: "test@test.com",
      name: "Test",
      surname: "User",
      user_name: "testuser",
    };
    mockLogin.mockResolvedValue({ token: "fake-jwt-token", user: fakeUser });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("usuario123"), "testuser");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    submitForm();

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
    });

    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(fakeUser);
  });

  it("displays error message when login API returns 401", async () => {
    mockLogin.mockRejectedValue(new Error("invalid credentials"));

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("usuario123"), "testuser");
    await user.type(screen.getByPlaceholderText("••••••••"), "wrongpassword");
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("invalid credentials")).toBeInTheDocument();
    });
  });

  it("displays generic error message on unexpected API failure", async () => {
    mockLogin.mockRejectedValue(new Error("Error al iniciar sesión"));

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByPlaceholderText("usuario123"), "testuser");
    await user.type(screen.getByPlaceholderText("••••••••"), "password123");
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Error al iniciar sesión")).toBeInTheDocument();
    });
  });
});
