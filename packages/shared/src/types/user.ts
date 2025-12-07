// User types
export interface UserDTO {
  id: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  user: UserDTO;
}
