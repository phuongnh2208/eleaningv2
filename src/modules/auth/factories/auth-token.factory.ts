/* eslint-disable */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';

@Injectable()
export class AuthTokenFactory {
  constructor(private readonly jwtService: JwtService) {}
  async createAccessTokenPayload(user: {
    id: number;
    email: string;
    role: string;
  }) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
  }
  async createRefreshTokenPayload(user: {
    id: number;
    email: string;
    role: string;
  }) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };
  }
  async createAccessToken(user: { id: number; email: string; role: string }) {
    const payload = await this.createAccessTokenPayload(user);
    return await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });
  }
  async createRefreshToken(user: { id: number; email: string; role: string }) {
    const payload = await this.createRefreshTokenPayload(user);
    return await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });
  }
  async createLoginResponse(user: {
    id: number;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);
    return {
      accessToken,
      refreshToken,
      user: UserMapper.toResponse(user),
    };
  }
}
