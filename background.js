// const BASE_URL = "http://localhost:5000/backend"; //local
const BASE_URL = "https://kafene-chrome-extension.herokuapp.com/backend"; //staging

const HOME_URL = "https://staging-merchant.kafene.com/";
const APPLICATION_URL = `${HOME_URL}applications/new`;
const LOGIN_URL = `${HOME_URL}login`;
const COMPLETE_STATUS = "complete";

importScripts("./scripts/apiService.js", "./scripts/utils.js");

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.data && request.data.type === "LOGIN_CREDENTIALS") {
    sendResponse();
    const res = await postCall("/auth/login", request.data.body);
    const content = await res.json();
    sendMessage(res.status, content, "LOGIN_SUCCESSFULL", "LOGIN_FAILED");
  }

  if (request.data && request.data.type === "SIGNUP") {
    sendResponse();
    const urlParams = new URLSearchParams(request.data.body);
    const entries = urlParams.entries();
    const params = paramsToObject(entries);
    const body = createSignupObj(params);
    const res = await postCall("/auth/signup", body);
    const content = await res.json();
    sendMessage(res.status, content, "LOGIN_SUCCESSFULL", "SIGNUP_FAILED");
  }

  if (request.data && request.data.type === "GET_APPLICANTS") {
    sendResponse();
    const res = await authorizedGetCall("/applicant/all", chrome);
    const content = await res.json();
    const list = generateDynamicApplicantList(content);
    sendMessage(
      res.status,
      res.status === 200 ? list : content,
      "APPLICANTS_LIST",
      "ERROR"
    );
  }

  if (request.data && request.data.type === "GET_FORM_FIELDS") {
    sendResponse();
    const res = await authorizedGetCall("/form/get-fields", chrome);
    const content = await res.json();
    const fields = generateDynamicForm(content);
    sendMessage(
      res.status,
      res.status === 200 ? fields : content,
      "FORM_FIELDS",
      "ERROR"
    );
  }

  if (request.data && request.data.type === "SUBMIT_APPLICATION_FORM") {
    sendResponse();
    const urlParams = new URLSearchParams(request.data.content);
    const entries = urlParams.entries();
    const params = paramsToObject(entries);
    const res = await authorizedPostCall("/form/submit", params, chrome);
    const content = await res.json();
    sendMessage(res.status, content, "SUBMIT_SUCCESS", "ERROR");
  }

  if (request.data && request.data.type === "GET_APPLICANT_FORM") {
    sendResponse();
    const res = await authorizedGetCall(
      `/applicant/fields/${request.data.content}`,
      chrome
    );
    const content = await res.json();
    sendMessage(res.status, content, "APPLICANT_FORM", "ERROR");
  }

  if (request.data && request.data.type === "LENDER_CREDENTIALS") {
    sendResponse();
    const res = await authorizedGetCall("/auth/lender-info", chrome);
    const content = await res.json();
    sendMessage(res.status, content, "LENDER_INFO", "ERROR");
  }
});

sendMessage = (status, content, successMsg = "", failureMsg = "") => {
  chrome.runtime.sendMessage({
    data: {
      type: status === 200 ? successMsg : failureMsg,
      content: status === 401 ? { ...content, status } : content,
    },
  });
};

chrome.tabs.onUpdated.addListener(async (tabId, { status }, tab) => {
  if (status === COMPLETE_STATUS && tab.url === LOGIN_URL) {
    chrome.storage.local.get(["redirect"], async function (data) {
      if (data?.redirect) {
        clearNotifications();
        chrome.notifications.create("autoLogin", {
          type: "basic",
          title: "You are not logged in.",
          iconUrl: "logo.png",
          message: "Sit tight, executing auto login.",
        });
        const res = await authorizedGetCall("/auth/lender-info", chrome);
        const content = await res.json();
        chrome.tabs.sendMessage(tabId, {
          data: { content, type: "FILL_LENDER_INFO" },
        });
      }
    });
  } else if (status === COMPLETE_STATUS && tab.url === HOME_URL) {
    chrome.storage.local.get(["redirect"], function (data) {
      if (data?.redirect) {
        clearNotifications();
        chrome.notifications.create("redirect", {
          type: "basic",
          title: "Redirecting...",
          iconUrl: "logo.png",
          message: "Redirecting to application page.",
        });
        chrome.storage.local.set({ redirect: false });
        chrome.tabs.update(tabId, { url: APPLICATION_URL }, function () {});
      }
    });
  } else if (status === COMPLETE_STATUS && tab.url === APPLICATION_URL) {
    chrome.storage.local.get(["applicationData"], async function (data) {
      if (data.applicationData) {
        clearNotifications();
        chrome.notifications.create("formFill", {
          type: "basic",
          title: "Fetching form data...",
          iconUrl: "logo.png",
          message: "Form data is being filled!",
        });
        const res = await authorizedGetCall(
          `/applicant/fields/${data.applicationData}`,
          chrome
        );
        const content = await res.json();
        chrome.tabs.sendMessage(
          tabId,
          {
            data: { content, type: "FILL_FORM", wait: true },
          },
          function () {
            chrome.storage.local.set({ applicationData: null });
          }
        );
      }
    });
  }
});

clearNotifications = () => {
  chrome.notifications.getAll((items) => {
    if (items) {
      for (let key in items) {
        chrome.notifications.clear(key);
      }
    }
  });
};
