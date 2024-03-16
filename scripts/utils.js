generateDynamicForm = (fields) => {
  let js = `<div class="loading d-none style-2"><div class="loading-wheel"></div></div>
  <div class="form p-3">
  <div class="w-100"><span class="back"><img class="previousIcon" alt="back" src="../assets/previous.png"
  /></span></div>`;
  if (fields.length) {
    fields.sort((a, b) => a.order_number - b.order_number);
    js += `<h1 class="text-center pb-3">Application Form</h1>
              <form id="applicationForm">`;
    js += `<div class="form-outline mb-4">
        <input placeholder="Applicant Nick Name" required name="applicantNick" type="text" class="form-control" />
      </div>
      <hr/>`;

    fields.forEach((field) => {
      if (field.field_type === "radio") {
        js += `<label class="form-label">${field.field_label}</label>`;
        field.options.forEach((option) => {
          js += `<div class="form-check">
          <input class="form-check-input" type="radio" ${
            field?.isRequired ? "required" : ""
          } name="${field.id}" id="${option.id}" value="${option.id}">
          <label class="form-check-label" for="${option.id}">${
            option.value
          }</label>
        </div>`;
        });
      } else if (field.field_type === "select") {
        js += `<label class="form-label">${field.field_label}</label>
        <div class="form-outline mb-4">
          <select ${field?.isRequired ? "required" : ""} name="${
          field.id
        }" class="form-select">
      `;
        field.options.forEach((option) => {
          js += `<option value="${option}">${option}</option>`;
        });
        js += `</select></div>`;
      } else {
        js += `<label class="form-label">${field.field_label}</label>
        <div class="form-outline mb-4">
        <input ${field?.isRequired ? "required" : ""} name="${
          field.id
        }" type="${field.field_type}" class="form-control" />
      </div>`;
      }
    });
    js += `<button type="submit" id="submitApplicationForm" class="btn btn-success btn-block mb-4">
            Submit
        </button>
        </form>`;
  } else {
    js += `<div class="p-5 text-center">No Form found</div>`;
  }
  js += `</div>`;

  return js;
};

generateDynamicApplicantList = (applicants) => {
  let js = `<div id="applicantsList" class="applicantsList p-3">
  <div class="w-100 mb-3"><span class="back"><img class="previousIcon" alt="back" src="../assets/previous.png"
  /></span></div>`;

  applicants.length
    ? applicants.forEach((applicant) => {
        js += `<div class="w-100 d-flex align-items-center justify-content-around">
          <p class="w-75 mr-3 mb-0">${applicant.applicant_name}</p>
          <button class="w-25 btn btn-success" id="${applicant.id}" type="button">Fill</button>
          </div><hr/>`;
      })
    : (js += `<div class="p-5 text-center">No Applicants found</div>`);

  js += `</div>`;
  return js;
};

paramsToObject = (entries) => {
  const result = {};
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
};

createSignupObj = (params) => {
  return {
    user: {
      name: params.name,
      email: params.email,
      password: params.password,
      role: "admin",
      phone_num: params.phone_num,
    },
    lender: {
      lender_name: params.lender_name,
      lender_email: params.lender_email,
      hashed_password: params.hashed_password,
    },
    merchant: {
      name: params.merchant_name,
      location: params.location,
      phone_num: params.merchant_phone_num,
    },
  };
};
