chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.data && request.data.type === "FILL_FORM") {
    setTimeout(
      () => {
        fillForm(request.data.content);
      },
      request?.data?.wait ? 4000 : 0
    );
    sendResponse();
  } else if (request.data && request.data.type === "FILL_LENDER_INFO") {
    const lender = request.data.content;
    setTimeout(() => {
      fill($('[placeholder="Email Address"]'), lender.lender_email);
      fill($('[placeholder="Password"]'), lender.hashed_password);
      const button = $("form button.btn");
      button.trigger("click");
    }, 4000);
    sendResponse();
  }
  return true;
});

fillForm = (fields) => {
  fields.forEach((field) => {
    if (field.connect_to_id === "monthly_income") {
      setTimeout(() => {
        let el = $(`#${field.connect_to_id} input`);
        if (el) {
          el = el[0];
          el.focus();
          el.select();
          el.value = field["field_values.value"];
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, 3000);
    } else if (field.field_type === "radio") {
      fillRadio(field["field_values.value"]);
    } else if (field.field_type === "date") {
      fillDateInfo(
        field.connect_to_id,
        field["field_values.value"],
        field.field_label
      );
    } else {
      fillInfo(
        `#${field.connect_to_id} input`,
        field["field_values.value"],
        field.field_label
      );
    }
  });
};

function fillRadio(id) {
  const el = $(`#${id}`);
  el.prop("checked", true);
  fire(el[0], ["keydown", "keypress", "input", "keyup"]);
}

function fillDateInfo(id, value, placeholder = "") {
  if ($(`#${id} #month`)[0] && $(`#${id} #day`)[0] && $(`#${id} #year`)[0]) {
    setTimeout(() => {
      const dateParts = value.split("-");
      fillInfo(`#${id} #month`, dateParts[1]);
      fillInfo(`#${id} #day`, dateParts[2]);
      fillInfo(`#${id} #year`, dateParts[0]);
    }, 2000);
  } else {
    let el = $(`#${id} input`);
    if (!el[0]) el = $(`[placeholder="${placeholder}"]`);
    if (el.prop("disabled")) {
      setTimeout(() => fill(el, value), 2000);
    } else {
      fill(el, value);
    }
  }
}

function fillInfo(id, value, placeholder = "") {
  let el = $(id);
  if (!el[0]) el = $(`[placeholder="${placeholder}"]`);
  if (el.prop("disabled")) {
    setTimeout(() => fill(el, value), 2000);
  } else {
    fill(el, value);
  }
}

function fill(el, value) {
  const htmlEl = el[0];

  if (htmlEl && value) {
    htmlEl.focus({ preventScroll: !0 });
    htmlEl.value = value;
    fire(htmlEl, ["keydown", "keypress", "input", "keyup"]);
    htmlEl.blur();
  }
}

function fire(n, t, i) {
  if (n && !n.isContentEditable) {
    if (n.value === undefined) return;
    t.push("change");
  }
  i = i || n.classList.contains("wym_iframe");
  for (var r = 0; r < t.length; ++r)
    n.dispatchEvent(new Event(t[r], { bubbles: !i }));
}
