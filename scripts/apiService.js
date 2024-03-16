postCall = async (endpoint, body = "") => {
  return fetch(BASE_URL + endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

getCall = async (endpoint) => {
  return fetch(BASE_URL + endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
};

authorizedPostCall = async (endpoint, body = "", chrome) => {
  const data = await getUpdatedTokens(chrome);
  return fetch(BASE_URL + endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      token: data.token,
    },
    body: JSON.stringify(body),
  });
};

authorizedGetCall = async (endpoint, chrome) => {
  const data = await getUpdatedTokens(chrome);
  return fetch(BASE_URL + endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      token: data.token,
    },
  });
};

getUpdatedTokens = async (chrome) => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(["token", "refreshToken"], async function (data) {
        if (isTokenExpired(data.token) || !data.token) {
          const res = await fetch(BASE_URL + "/auth/refresh-token", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: data.refreshToken }),
          });
          const content = await res.json();
          chrome.storage.local.set(
            {
              token: content.accessToken,
              refreshToken: content.refreshToken,
            },
            () =>
              resolve({
                token: content.accessToken,
                refreshToken: content.refreshToken,
              })
          );
        } else {
          resolve({
            token: data.token,
            refreshToken: data.refreshToken,
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

isTokenExpired = (token) =>
  Date.now() >= JSON.parse(atob(token.split(".")[1])).exp * 1000;
