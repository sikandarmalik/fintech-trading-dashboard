import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthResponseDTO, UserDTO } from '@trading/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDTO> {
    // Check if user exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
    });

    // Generate JWT
    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: this.toUserDTO(user),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDTO> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: this.toUserDTO(user),
    };
  }

  async validateUser(userId: string): Promise<UserDTO | null> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }
    return this.toUserDTO(user);
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  private toUserDTO(user: { id: string; email: string; createdAt: Date }): UserDTO {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
