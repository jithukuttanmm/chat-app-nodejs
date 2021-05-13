const socket = io();
//elements
const $sendMessages = document.querySelector("#send");
const $messages = document.querySelector("#messages");
$input = document.querySelector("#idone");

//template
const messageTemplate = document.querySelector("#message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  // new message
  const $newMessage = $messages.lastElementChild;

  //height of last message
  const newMessageStyle = getComputedStyle($newMessage);
  const newMessageMArgin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMArgin;

  //visible height
  const visibleHeight = $messages.offsetHeight;

  //container height
  const containerHeight = $messages.scrollHeight;

  //how far i scrolled
  const scrollOffset = $messages.scrollOffset + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("broadcast", (message) => {
  const html = Mustache.render(messageTemplate, {
    createdAt: moment(message.createdAt).format("hh:mm a"),
    message: message.text,
    username: message.username,
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

$sendMessages.addEventListener("click", () => {
  if ($input.value) {
    socket.emit("sendMessage", $input.value, () => {
      $input.value = "";
    });
  }
});

socket.emit(
  "join",
  {
    username,
    room,
  },
  (error) => {
    if (error) alert(error);
    location.href = "/";
  }
);

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});
