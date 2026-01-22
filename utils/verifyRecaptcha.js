import axios from "axios";

export const verifyRecaptchaV3 = async (token) => {
  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${process.env.RECAPTCHA_PROJECT_ID}/assessments?key=${process.env.RECAPTCHA_API_KEY}`;

  const body = {
    event: {
      token,
      siteKey: process.env.RECAPTCHA_SITE_KEY,
      expectedAction: "LOGIN",
    },
  };

  const { data } = await axios.post(url, body);
  return data;
};

export default verifyRecaptchaV3;