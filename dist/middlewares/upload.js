import multer from 'multer';
import path from 'path';

// 1. 저장 위치와 파일 이름 설정
const storage = multer.diskStorage({
  // destination: 파일이 저장될 폴더를 지정합니다.
  destination: (req, file, cb) => {
    // 'uploads/' 폴더에 파일을 저장합니다. 
    // 이 폴더는 프로젝트 최상위 경로에 미리 만들어두어야 합니다.
    cb(null, 'uploads/');
  },
  // filename: 저장될 파일의 이름을 지정합니다.
  filename: (req, file, cb) => {
    // 파일 이름이 겹치는 것을 방지하기 위해,
    // 파일의 원본 이름 앞에 현재 시간을 밀리초 단위로 붙여 고유한 이름을 만듭니다.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname); // 원본 파일의 확장자를 가져옵니다.
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// 2. 위에서 설정한 storage를 사용해 multer 인스턴스를 생성합니다.
const upload = multer({
  storage: storage
  // 여기에 파일 크기 제한 등 다른 옵션을 추가할 수 있습니다.
  // limits: { fileSize: 5 * 1024 * 1024 } // 예: 5MB로 크기 제한
});

// 3. 설정이 완료된 upload 객체를 다른 파일에서 쓸 수 있도록 export 합니다.
export default upload;