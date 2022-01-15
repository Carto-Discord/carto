function onLoad() {
  const socket = new WebSocket("ws://localhost:3000");

  // Listen for messages
  socket.addEventListener("message", function (event) {
    console.log("Message from server ", event.data);
    const messageList = document.getElementById("messages");

    const li = document.createElement("li");
    li.appendChild(document.createTextNode(event.data));

    messageList.appendChild(li);
  });
}

window.onload = onLoad;
