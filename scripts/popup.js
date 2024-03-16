const HOME_URL = "https://staging-merchant.kafene.com/";
const APPLICATION_URL = `${HOME_URL}applications/new`;
const LOGIN_URL = `${HOME_URL}login`;
const COMPLETE_STATUS = "complete";

$(function () {
  //check if signed in
  chrome.storage.local.get(["isLoggedIn"], function (data) {
    if (data?.isLoggedIn) {
      switchComponent("components/menu.html");
    } else {
      switchComponent("components/loginForm.html");
    }
  });

  //signin
  $("#main-div").on("keypress", "#password", function (e) {
    if (e.which == 13) {
      signinFunction(e);
    }
  });
  $("#main-div").on("click", "#signin", signinFunction);

  //signup
  $("#main-div").on("click", "#signup", function (e) {
    e.preventDefault();
    if (!$("#signupForm")[0].reportValidity()) return;
    $("#signuperr").html("");
    $(".loading").toggleClass("d-none");
    const body = $("#signupForm").serialize();
    chrome.runtime.sendMessage({
      data: { type: "SIGNUP", body },
    });
  });

  $("#main-div").on("click", "#formMenu", function (e) {
    e.preventDefault();
    $(".loading").toggleClass("d-none");
    chrome.runtime.sendMessage({
      data: { type: "GET_FORM_FIELDS" },
    });
  });

  $("#main-div").on("click", "#logout", function (e) {
    e.preventDefault();
    $(".loading").toggleClass("d-none");
    chrome.storage.local.set({ isLoggedIn: false });
    chrome.notifications.create("logout", {
      type: "basic",
      title: "Logged Out Successfully!",
      iconUrl: "logo.png",
      message: "You have been logged out!",
    });
    switchComponent("components/loginForm.html");
  });

  $("#main-div").on("click", "#register", function (e) {
    e.preventDefault();
    switchComponent("components/signup.html");
  });

  $("#main-div").on("click", "#applicantsMenu", function (e) {
    e.preventDefault();
    $(".loading").toggleClass("d-none");
    chrome.runtime.sendMessage({
      data: { type: "GET_APPLICANTS" },
    });
  });

  $("#main-div").on("click", "#loginAutofill", function (e) {
    e.preventDefault();
    $(".loading").toggleClass("d-none");
    chrome.runtime.sendMessage({
      data: { type: "LENDER_CREDENTIALS" },
    });
  });

  $("#main-div").on("click", "#submitApplicationForm", function (e) {
    e.preventDefault();
    if (!$("#applicationForm")[0].reportValidity()) return;
    $(".loading").toggleClass("d-none");
    const content = $("#applicationForm").serialize();
    chrome.runtime.sendMessage({
      data: { type: "SUBMIT_APPLICATION_FORM", content },
    });
  });

  $("#main-div").on("keyup keypress", "#applicationForm", function (e) {
    var keyCode = e.charCode || e.keyCode || 0;
    if (keyCode === 13) {
      e.preventDefault();
      return false;
    }
  });

  $("#main-div").on("click", "#applicantsList", function (event) {
    event.preventDefault();
    const isButton = event.target.nodeName === "BUTTON";
    if (!isButton) {
      return;
    }
    chrome.runtime.sendMessage({
      data: { type: "GET_APPLICANT_FORM", content: event.target.id },
    });
  });

  $("#main-div").on("click", ".back", function (event) {
    event.preventDefault();
    switchComponent("components/menu.html");
  });

  $("#main-div").on("click", ".back-login", function (event) {
    event.preventDefault();
    switchComponent("components/loginForm.html");
  });
});

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.data.type === "LOGIN_SUCCESSFULL") {
    chrome.storage.local.set({
      isLoggedIn: "true",
      token: request.data.content.token,
      refreshToken: request.data.content.refresh_token,
    });
    chrome.notifications.create("login", {
      type: "basic",
      title: "Logged In Successfully!",
      iconUrl: "logo.png",
      message: "Yohoo! You have been logged in!",
    });
    switchComponent("components/menu.html");
  } else if (request.data.type === "LOGIN_FAILED") {
    $(".loading").toggleClass("d-none");
    $("#loginerr").html(
      `<p class="mb-0 alert alert-danger" >${request.data.content.error}</p>`
    );
  } else if (request.data.type === "SIGNUP_FAILED") {
    $(".loading").toggleClass("d-none");
    $("#signuperr").html(
      `<p class="mb-0 alert alert-danger" >${request.data.content.error}</p>`
    );
  } else if (request.data.type === "FORM_FIELDS") {
    $("#main-div").html(request.data.content);
  } else if (request.data.type === "SUBMIT_SUCCESS") {
    chrome.notifications.create("formSubmit", {
      type: "basic",
      title: "Form Submitted Successfully!",
      iconUrl: "logo.png",
      message: "Yohoo! Form fields has been saved!",
    });
    switchComponent("components/menu.html");
  } else if (request.data.type === "APPLICANTS_LIST") {
    $("#main-div").html(request.data.content);
  } else if (request.data.type === "APPLICANT_FORM") {
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0].url === APPLICATION_URL) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          data: { type: "FILL_FORM", content: request.data.content },
        },
        function () {
          window.close();
        }
      );
    } else {
      const applicationData = request?.data?.content?.length
        ? request?.data?.content[0]["field_values.applicant_id"]
        : null;
      chrome.storage.local.set({
        redirect: true,
        applicationData,
      });
      if (tabs[0].url === LOGIN_URL) {
        chrome.runtime.sendMessage({
          data: { type: "LENDER_CREDENTIALS" },
        });
      } else {
        chrome.tabs.create({ url: APPLICATION_URL });
      }
    }
  } else if (request.data.type === "LENDER_INFO") {
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        data: { type: "FILL_LENDER_INFO", content: request.data.content },
      },
      function () {
        window.close();
      }
    );
  } else if (request.data.type === "ERROR") {
    $(".loading").toggleClass("d-none");
    if (request?.data?.content?.status === 401) {
      chrome.storage.sync.set({ isLoggedIn: false });
      switchComponent("components/loginForm.html");
    }
    chrome.notifications.create("error", {
      type: "basic",
      title: "Operation Unsuccessfull",
      iconUrl: "logo.png",
      message: request?.data?.content?.error
        ? JSON.stringify(request?.data?.content?.error)
        : "Something went wrong!",
    });
  }
  sendResponse();
});

switchComponent = (path) => {
  fetch(path)
    .then((data) => data.text())
    .then((html) => {
      $("#main-div").html(html);
    });
};

function signinFunction(e) {
  e.preventDefault();
  if (!$("#siginForm")[0].reportValidity()) return;
  $("#loginerr").html("");
  $(".loading").toggleClass("d-none");
  const email = $("#email").val();
  const password = $("#password").val();
  chrome.runtime.sendMessage({
    data: { type: "LOGIN_CREDENTIALS", body: { email, password } },
  });
}
