import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Audit } from '../admin/audit.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserPublicDto } from './dto/user-public.dto';
import { UsersService } from './users.service';

@ApiTags('admin-users')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Audit({ entityType: 'user', action: 'create' })
  @ApiOperation({
    summary: 'Create a new admin user',
    description:
      'Creates a user with the `admin` role. Only existing admins can call this endpoint. ' +
      'Email must be unique. The created user can sign in immediately via `POST /auth/log-in`.',
  })
  @ApiResponse({
    status: 201,
    description: 'New admin created.',
    type: UserPublicDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin.' })
  @ApiResponse({ status: 409, description: 'Email is already registered.' })
  async create(@Body() dto: CreateAdminUserDto): Promise<UserPublicDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: 'admin',
    });
    return this.usersService.toPublicDto(user);
  }

  @Get()
  @ApiOperation({
    summary: 'List users',
    description:
      'Paginated list of all users. Supports search by name/email substring and filter by role.',
  })
  @ApiResponse({ status: 200, type: PaginatedUsersDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin.' })
  list(@Query() query: ListUsersQueryDto): Promise<PaginatedUsersDto> {
    return this.usersService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single user by id',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: UserPublicDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin.' })
  @ApiResponse({ status: 404, description: 'No user with this id.' })
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserPublicDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`No user with id ${id}.`);
    }
    return this.usersService.toPublicDto(user);
  }
}
