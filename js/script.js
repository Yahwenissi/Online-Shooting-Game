// Client-side JS

$(document).ready(()=>{
    $("#canvas").append("<h2 class='text-center' style='margin: 200px'>Click for Start Game</h2>");
    $("#canvas").click(startGame);
});

let ballons = { ballon: [] };
let totalScore = 0;
let totalBallons = 0;
let ballonColor = ["ballon-red", "ballon-yellow", "ballon-green"];
let setIntervalMoveBallons;
let setIntervalCheckBallons;
let gamePlay = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const startGame = () => {
    $("#canvas").html("");
    $("#canvas").css("cursor", "url('./img/shoot.png'), auto");
    $("#canvas").unbind("click");
    gamePlay = true;
    showStarterBallon();
    setIntervalMoveBallons = setInterval(moveBallons, 50);
};

const showStarterBallon = async () => {
    for (let i = 0; i < 5 && gamePlay; i++) {
        totalBallons += 1;
        let randomColor = Math.floor(Math.random() * 3);
        let cursorWidth = $("#canvas").width();
        let left = Math.floor(Math.random() * (cursorWidth - 60)) + "px";
        $("#canvas").append(`<div id='ballon-${totalBallons}' class='ballon ${ballonColor[randomColor]}' style='bottom: 0px; left: ${left}'><div class='dhaga'></div></div>`);
        $(`#ballon-${totalBallons}`).bind('click', { id: totalBallons }, destroy);
        ballons[`ballon-${totalBallons}`] = { speed: Math.floor(Math.random() * 10 + 1), bottom: 10 };
        ballons.ballon.push(totalBallons);
        await sleep(1000);
    }
    checkBallons();
    if (gamePlay) {
        setIntervalCheckBallons = setInterval(checkBallons, 2000);
    }
};

const checkBallons = async () => {
    for (let i = 0; i < 5 && gamePlay; i++) {
        if (!ballons.ballon[i]) {
            totalBallons += 1;
            let randomColor = Math.floor(Math.random() * 3);
            let cursorWidth = $("#canvas").width();
            let left = Math.floor(Math.random() * (cursorWidth - 60)) + "px";
            $("#canvas").append(`<div id='ballon-${i + 1}' class='ballon ${ballonColor[randomColor]}' style='bottom: 0px; left: ${left}'><div class='dhaga'></div></div>`);
            $(`#ballon-${i + 1}`).bind('click', { id: i + 1 }, destroy);
            ballons[`ballon-${i + 1}`] = { speed: Math.floor(Math.random() * 10 + 1), bottom: 10 };
            ballons.ballon[i] = i + 1;
            await sleep(1000);
        }
    }
};

function moveBallons() {
    try {
        ballons.ballon.forEach(s => {
            if (gamePlay) {
                let bottom = parseInt($(`#ballon-${s}`).css("bottom"));
                bottom += ballons[`ballon-${s}`].speed;
                $(`#ballon-${s}`).css("bottom", bottom + "px");
                ballons[`ballon-${s}`].bottom = bottom;
                if (bottom > 400) {
                    clearInterval(setIntervalCheckBallons);
                    clearInterval(setIntervalMoveBallons);
                    gamePlay = false;
                    alert("Your score: " + totalScore);
                    ballons = { ballon: [] };
                    totalScore = 0;
                    totalBallons = 0;
                    $("#canvas").html("");
                    $("#canvas").css("cursor", "pointer");
                    $("#canvas").append("<h2 class='text-center' style='margin: 200px'>Click to Restart Game</h2>");
                    $("#canvas").click(startGame);
                }
            }
        });
    } catch (error) {
        console.log("Error moving balloons:", error);
    }
}

const destroy = (event) => {
    $(`#ballon-${event.data.id}`).remove();
    delete ballons.ballon[event.data.id - 1];
    delete ballons[`ballon-${event.data.id}`];
    totalScore += 1;

    const balloonId = event.data.id;
    socket.emit('shootBalloon', balloonId); // Notify server
};

const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});

socket.on('newBalloon', (balloon) => {
    $("#canvas").append(
        `<div id='${balloon.id}' class='ballon ${balloon.color}' style='left:${balloon.position.left}px; bottom:0px'></div>`
    );
    $(`#${balloon.id}`).bind('click', { id: balloon.id }, destroy);
});

socket.on('updatePlayers', (players) => {
    let playerListHtml = '';
    Object.values(players).forEach(player => {
        playerListHtml += `<li>${player.id}: <span>${player.score}</span></li>`;
    });
    $("#players-list").html(playerListHtml);
});

socket.on('balloonDestroyed', (data) => {
    console.log(`Balloon ${data.balloonId} destroyed by player ${data.playerId}`);
    $(`#${data.balloonId}`).remove();
});