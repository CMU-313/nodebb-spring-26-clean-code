import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "20s", target: 10 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.1"],
  },
};

const BASE_URL = "http://17313-team11.s3d.cmu.edu:4567";

export default function () {
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    "homepage returns 200": (r) => r.status === 200,
    "homepage loads within 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);

  const categoriesRes = http.get(`${BASE_URL}/api/categories`);
  check(categoriesRes, {
    "categories API returns 200": (r) => r.status === 200,
    "categories API loads within 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);

  const generalRes = http.get(`${BASE_URL}/category/2/general-discussion`);
  check(generalRes, {
    "General Discussion returns 200": (r) => r.status === 200,
  });

  sleep(1);

  const announcementsRes = http.get(`${BASE_URL}/category/1/announcements`);
  check(announcementsRes, {
    "Announcements returns 200": (r) => r.status === 200,
  });

  sleep(1);
}
