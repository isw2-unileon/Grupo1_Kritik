import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RegisterPage from "../RegisterPage";
import { AuthProvider } from "@/contexts/AuthContext";

const { mockRegister, mockLogin } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockLogin: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  register: mockRegister,
  login: mockLogin,
}));

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider>
        <RegisterPage />
        <LocationDisplay />
      </AuthProvider>
    </MemoryRouter>
  );
}

function submitForm() {
  fireEvent.submit(document.querySelector("form")!);
}

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText("Nicol"), "Test");
  await user.type(screen.getByPlaceholderText("González Pérez"), "Surname");
  await user.type(screen.getByPlaceholderText("usuario123"), "testuser");
  const pwds = screen.getAllByPlaceholderText("••••••••");
  await user.type(pwds[0], "password123");
  await user.type(pwds[1], "password123");
  fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), {
    target: { value: "2000-01-01" },
  });
  await user.type(screen.getByPlaceholderText("correo@ejemplo.com"), "test@test.com");
};

beforeEach(() => {
  mockRegister.mockReset();
  mockLogin.mockReset();
  localStorage.clear();
});

afterEach(cleanup);

describe("RegisterPage", () => {
  it("renders the registration form with title, inputs, and submit button", () => {
    renderRegisterPage();

    expect(screen.getByText("Únete a Kritik")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nicol")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("González Pérez")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("usuario123")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("••••••••")).toHaveLength(2);
    expect(screen.getByLabelText("Fecha de nacimiento")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("correo@ejemplo.com")).toBeInTheDocument();
    expect(screen.getByText("Registrarme")).toBeInTheDocument();
  });

  it("shows validation error when name is empty on submit", async () => {
    //const user = userEvent.setup();
    renderRegisterPage();

    submitForm();

    expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
  });

  it("shows validation error when email format is invalid", async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByPlaceholderText("Nicol"), "Test");
    await user.type(screen.getByPlaceholderText("correo@ejemplo.com"), "bad-email");
    submitForm();

    expect(
      screen.getByText("El correo electrónico no tiene un formato válido")
    ).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByPlaceholderText("Nicol"), "Test");
    await user.type(screen.getByPlaceholderText("correo@ejemplo.com"), "test@test.com");
    const pwds = screen.getAllByPlaceholderText("••••••••");
    await user.type(pwds[0], "password123");
    await user.type(pwds[1], "different");
    submitForm();

    expect(screen.getByText("Las contraseñas no coinciden")).toBeInTheDocument();
  });

  it("shows validation error when username is empty", async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByPlaceholderText("Nicol"), "Test");
    await user.type(screen.getByPlaceholderText("González Pérez"), "Surname");
    await user.type(screen.getByPlaceholderText("correo@ejemplo.com"), "test@test.com");
    const pwds = screen.getAllByPlaceholderText("••••••••");
    await user.type(pwds[0], "password123");
    await user.type(pwds[1], "password123");
    submitForm();

    expect(
      screen.getByText("El nombre de usuario es obligatorio")
    ).toBeInTheDocument();
  });

  it("registers user and navigates to /dashboard on success", async () => {
    const fakeUser = {
      id: 1,
      email: "test@test.com",
      name: "Test",
      surname: "Surname",
      user_name: "testuser",
    };
    mockRegister.mockResolvedValue(fakeUser);
    mockLogin.mockResolvedValue({ token: "fake-jwt-token", user: fakeUser });

    const user = userEvent.setup();
    renderRegisterPage();

    await fillValidForm(user);
    submitForm();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@test.com",
          name: "Test",
          surname: "Surname",
          user_name: "testuser",
        })
      );
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "password123");
    });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
    });

    expect(localStorage.getItem("token")).toBe("fake-jwt-token");
  });

  it("displays error message when register API returns 409 conflict", async () => {
    mockRegister.mockRejectedValue(new Error("email already registered"));

    const user = userEvent.setup();
    renderRegisterPage();

    await fillValidForm(user);
    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText("email already registered")
      ).toBeInTheDocument();
    });
  });

  it("displays generic error message on unexpected register failure", async () => {
    mockRegister.mockRejectedValue(new Error("Error al registrarse"));

    const user = userEvent.setup();
    renderRegisterPage();

    await fillValidForm(user);
    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText("Error al registrarse")
      ).toBeInTheDocument();
    });
  });
});
