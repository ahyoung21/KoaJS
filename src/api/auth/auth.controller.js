const Joi = require('joi');
const Account = require('models/Account');

// 로컬 회원가입
exports.localRegister = async (ctx) => {
  // 데이터 검증
  // const schema = Joi.object().keys({
  //   username: Joi.string().alphanum().min(4).max(15).required(),
  //   email: Joi.string().email().required(),
  //   password: Joi.string().required().min(6),
  // });

  const schema = Joi.object({
    name: Joi.string().min(6).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });

  // const validation = schema.validate(req.body);
  // res.send(validation);
  // const result = Joi.validate(ctx.request.body, schema);
  const result = schema.validate(ctx.request.body);
  console.log(result);

  // res.send(result);

  // 스키마 검증 실패
  if (result.error) {
    ctx.status = 400;
    return;
  }

  // 아이디 / 이메일 중복 체크
  let existing = null;
  try {
    existing = await Account.findByEmailOrUsername(ctx.request.body);
  } catch (e) {
    ctx.throw(500, e);
  }

  if (existing) {
    // 중복되는 아이디/이메일이 있을 경우
    ctx.status = 409; // Conflict
    // 어떤 값이 중복되었는지 알려줍니다
    ctx.body = {
      key: existing.email === ctx.request.body.email ? 'email' : 'username',
    };
    return;
  }

  // 계정 생성
  let account = null;
  try {
    account = await Account.localRegister(ctx.request.body);
  } catch (e) {
    ctx.throw(500, e);
  }

  console.log('account.profile', account.profile);

  ctx.body = account.profile; // 프로필 정보로 응답합니다.
};

// 로컬 로그인
exports.localLogin = async (ctx) => {
  // 데이터 검증
  const schema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  // const result = Joi.validate(ctx.request.body, schema);
  const result = schema.validate(ctx.request.body);

  if (result.error) {
    ctx.status = 400; // Bad Request
    return;
  }

  const { email, password } = ctx.request.body;

  let account = null;
  try {
    // 이메일로 계정 찾기
    account = await Account.findByEmail(email);
  } catch (e) {
    ctx.throw(500, e);
  }

  if (!account || !account.validatePassword(password)) {
    // 유저가 존재하지 않거나 || 비밀번호가 일치하지 않으면
    ctx.status = 403; // Forbidden
    return;
  }

  ctx.body = account.profile;
};

// 이메일 / 아이디 존재유무 확인
exports.exists = async (ctx) => {
  const { key, value } = ctx.params;
  let account = null;

  try {
    // key 에 따라 findByEmail 혹은 findByUsername 을 실행합니다.
    account = await (key === 'email' ? Account.findByEmail(value) : Account.findByUsername(value));
  } catch (e) {
    ctx.throw(500, e);
  }

  ctx.body = {
    exists: account !== null,
  };
};

// 로그아웃
exports.logout = async (ctx) => {
  ctx.body = 'logout';
};
