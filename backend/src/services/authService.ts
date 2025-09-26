import User, { IUser } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateToken } from '../utils/jwt.js';

export class AuthService {
  static async signup(userData: {
    name: string;
    email: string;
    mobile: string;
    role: 'user' | 'lawyer';
    password: string;
  }) {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { mobile: userData.mobile }]
    });

    if (existingUser) {
      throw new Error('User with this email or mobile already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = new User({
      ...userData,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id?.toString() || '',
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      },
      token
    };
  }

  static async login(emailOrMobile: string, password: string) {
    // Find user by email or mobile
    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }]
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken({
      userId: user._id?.toString() || '',
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      },
      token
    };
  }
}
