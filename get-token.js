/**
 * JWT 토큰 발급 도우미 스크립트
 * 사용법: node get-token.js [email] [password]
 */

const email = process.argv[2] || 'test@example.com';
const password = process.argv[3] || 'password123';
const serverUrl = process.argv[4] || 'http://localhost:3000';

async function getToken() {
  try {
    console.log('🔐 로그인 시도 중...');
    console.log(`   Email: ${email}`);
    console.log(`   Server: ${serverUrl}`);

    const response = await fetch(`${serverUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: email,
        user_password: password,
      }),
    });

    const data = await response.json();

    if (data.code !== 200) {
      console.error('❌ 로그인 실패:', data.message);
      process.exit(1);
    }

    console.log('\n✅ 로그인 성공!');
    console.log('\n📋 Access Token:');
    console.log(data.data.accessToken);
    console.log('\n📋 Refresh Token:');
    console.log(data.data.refreshToken);
    console.log('\n💡 테스트 페이지에 위 Access Token을 복사하세요.\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

getToken();
