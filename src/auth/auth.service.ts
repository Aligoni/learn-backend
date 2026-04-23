import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LogInDto } from './dto/log-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'An account with this email already exists. Try logging in instead.',
      );
    }
    const user = await this.usersService.create(dto.email, dto.password);
    const accessToken = await this.signAccessToken(user.id, user.email);
    return {
      accessToken,
      user: this.usersService.toPublicDto(user),
    };
  }

  async logIn(dto: LogInDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const ok = await this.usersService.validatePassword(user, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const accessToken = await this.signAccessToken(user.id, user.email);
    return {
      accessToken,
      user: this.usersService.toPublicDto(user),
    };
  }

  private async signAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.signAsync(payload);
  }
}
