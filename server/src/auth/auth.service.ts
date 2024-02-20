import * as bcrypt from 'bcrypt';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUser, UserService } from 'src/user/user.service';
import { AuthCredentialRegisterDTO } from './dto/auth-credentials-register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  private async createToken(user: IUser): Promise<string> {
    const payload = {
      sub: user.id,
      permission: user.permission,
      imageUrl: user.image,
    };
    const options = {
      expiresIn: '7 days',
    };

    return this.jwtService.sign(payload, options);
  }

  private async checkToken(token: string): Promise<object> {
    try {
      return await this.jwtService.verify(token);
    } catch (error) {
      throw new BadRequestException('Token inválido ou expirado.');
    }
  }

  private async comparePasswords(
    providedPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(providedPassword, hashedPassword);
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user || !(await this.comparePasswords(password, user.password))) {
      throw new UnauthorizedException('E-mail e/ou senha incorreto(s).');
    }

    return this.createToken(user);
  }

  async register(data: AuthCredentialRegisterDTO): Promise<string> {
    const user: IUser = await this.userService.create(data);
    return this.createToken(user);
  }
}
