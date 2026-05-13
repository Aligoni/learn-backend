import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserPublicDto } from '../users/dto/user-public.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LogInDto } from './dto/log-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a user with a hashed password and returns a JWT plus public profile. ' +
      'Email must be unique. If `X-Cart-Session` is provided, the matching guest cart is ' +
      'merged into the new account on success (quantities summed, capped at stock).',
  })
  @ApiBody({ type: SignUpDto })
  @ApiHeader({
    name: 'X-Cart-Session',
    required: false,
    description:
      'Optional guest cart session id. If present, that cart is merged into the new account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created; returns token and user.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (invalid email or password constraints).',
  })
  @ApiResponse({
    status: 409,
    description: 'Email is already registered.',
  })
  signUp(
    @Body() dto: SignUpDto,
    @Headers('x-cart-session') guestCartSessionId?: string,
  ): Promise<AuthResponseDto> {
    return this.authService.signUp(dto, guestCartSessionId);
  }

  @Post('log-in')
  @ApiOperation({
    summary: 'Sign in with email and password',
    description:
      'Validates credentials and returns a JWT and public profile. Use the token on protected routes. ' +
      'If `X-Cart-Session` is provided, the matching guest cart is merged into the user account on success ' +
      '(quantities summed with the existing user cart, capped at stock).',
  })
  @ApiBody({ type: LogInDto })
  @ApiHeader({
    name: 'X-Cart-Session',
    required: false,
    description:
      'Optional guest cart session id. If present, that cart is merged into the user account.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated; returns token and user.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Wrong email or password.',
  })
  logIn(
    @Body() dto: LogInDto,
    @Headers('x-cart-session') guestCartSessionId?: string,
  ): Promise<AuthResponseDto> {
    return this.authService.logIn(dto, guestCartSessionId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Who am I?',
    description:
      'Returns the currently authenticated user derived from the JWT (subject claim). ' +
      'Requires `Authorization: Bearer <accessToken>`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Public profile for the authenticated user.',
    type: UserPublicDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired bearer token.',
  })
  me(@CurrentUser() user: UserPublicDto): UserPublicDto {
    return user;
  }
}
