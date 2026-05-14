import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleWebAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Jika ada error atau user tidak ditemukan (karena allowCreate=false)
    if (err || !user) {
      // Mengirim flag ke controller agar controller yang melakukan redirect
      return { _isGoogleAuthFailed: true };
    }
    
    return user;
  }
}
