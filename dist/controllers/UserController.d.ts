import { Request, Response } from "express";
declare class AuthController {
    /**
     * 사용자 회원가입
     */
    registUser(req: Request, res: Response): Promise<void>;
    /**
     * 사용자 로그인 처리
     */
    loginUser(req: Request, res: Response): Promise<void>;
    /**
     * 이메일 인증 코드 발송
     */
    sendEmailVerification(req: Request, res: Response): Promise<void>;
}
declare const _default: AuthController;
export default _default;
