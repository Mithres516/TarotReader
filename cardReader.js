var startDragging = false;
var isDragging = false;
var newCard = -1;
var cardRect = { w: 200, h: 350 }
var cardCoos = { x: 0, y: 0 }
var hoveringDeck = false;
var cardsRotate = false;
var upsidedown = false;
var draggingCard = -1;
var cardDragCountdown = 0;
var maxCards = 21;

var ratio = .7;

var cards = [];
var playedCards = [];
var dragSensibility = 100;

$().ready(() => {
    initCards();
    $("#cards-size-x").change(function () {
        $(".changes-warning").show();
    });
    $("#cards-size-y").change(function () {
        $(".changes-warning").show();
    });
    $("#cards-number").change(function () {
        $(".changes-warning").show();
    });
    $("#toggle-rotable").change(function () {
        cardsRotate = $(this).is(":checked");
        localStorage.setItem("cardsRotate", cardsRotate);
        $("#toggle-rotable-desc").html(cardsRotate ? "Cards will randomly be upsidedown" : "Cards are always upright");
    });
    $("#keep-ratio").change(function () {
        if ($(this).is(":checked")) {
            ratio = $("#cards-size-x").val() / $("#cards-size-y").val();
            $("#display-ratio").html("Keep Ratio " + ratio);
        } else {
            ratio = 0;
            $("#display-ratio").html("Not keeping a ratio");
        }
    });
    $("#cards-size-x").change(function () {
        if (ratio > 0) {
            $("#cards-size-y").val($(this).val() / ratio);
        }
    });
    $("#cards-size-y").change(function () {
        if (ratio > 0) {
            $("#cards-size-x").val($(this).val() * ratio);
        }
    });
    $(".card-chooser").click(function () {
        $("#choose-card-input").attr("max", maxCards);
        $("#choose-card-dialog").show();
    });

    $("#choose-card-confirm").click(function (e) {
        cardCoos.y = e.clientY - (cardRect.h / 2);
        cardCoos.x = e.clientX - (cardRect.w / 2);
        const err = createCardAtPosition($("#choose-card-input").val());
        if (err == "error") {
            $("#choose-card-error-dialog").show();
        }
        $("#choose-card-dialog").hide();
    });
    $("#choose-card-cancel").click(function () {
        $("#choose-card-dialog").hide();
    });
    $("#choose-card-error-close").click(function () {
        $("#choose-card-error-dialog").hide();
    });

    $("#reset-cards").click(resetCards);

    $("#pick-card").mousedown(function (e) {
        cardCoos.y = e.clientY - (cardRect.h / 2);
        cardCoos.x = e.clientX - (cardRect.w / 2);
        startDragging = true;
        updateGhostPosition();
        showRemainingCards();
    });

    $("#table").mousemove(function (e) {
        if (draggingCard > -1 && new Date().getTime() - cardDragCountdown > dragSensibility) {
            cardCoos.y = e.clientY - (cardRect.h / 2);
            cardCoos.x = e.clientX - (cardRect.w / 2);
            $("#card-reveal-" + draggingCard).css({ left: cardCoos.x, top: cardCoos.y }).appendTo($("#table"));
        } if (isDragging) {
            cardCoos.y = e.clientY - (cardRect.h / 2);
            cardCoos.x = e.clientX - (cardRect.w / 2);
            updateGhostPosition();
        } else if (startDragging) {
            if (!isMouseInElement(e, $("#deck"))) {
                startDragging = false;
                isDragging = true;
            }
            cardCoos.y = e.clientY - (cardRect.h / 2);
            cardCoos.x = e.clientX - (cardRect.w / 2);
            updateGhostPosition();
        }
    });

    $("body").mouseup(function () {
        if (draggingCard > -1) {
            draggingCard = -1;
        }
        if (isDragging) {
            createCardAtPosition();
        }
        startDragging = false;
        isDragging = false;
        updateGhostPosition();
        showRemainingCards();
    });

});

function isMouseInElement(event, el) {
    const t = $(el);
    if (event.clientX >= t.offset().left && event.clientX <= t.offset().left + t.width()
        && event.clientY >= t.offset().top && event.clientY <= t.offset().top + t.height()) {
        return true;
    }
}

function createCardAtPosition(forceVal) {
    let err = getCard(forceVal);
    if (err == "error") {
        return err;
    }
    $("#table").append(`<div id="card-reveal-${newCard}" 
    class="flip-card card ${upsidedown ? 'upsidedown' : ''}" 
    style="
    width: ${cardRect.w};height: ${cardRect.h};
    left: ${cardCoos.x}px; top: ${cardCoos.y}px;
    ">
        <div class="flip-card-inner">
            <div class="flip-card-front">
            <img src="Cards/back.jpg" alt="back" style="width:100%;height:100%;" draggable="false">
            </div>
            <div class="flip-card-back">
                <img src="Cards/${newCard}.jpg" alt="${newCard}" style="width:100%;height:100%;" draggable="false">
            </div>
        </div>
    </div>`);
    let memorycard = newCard;
    $(`#card-reveal-${memorycard}`).mousedown(function (e) {
        if (e.which == 1) {
            cardDragCountdown = new Date().getTime();
            draggingCard = memorycard;
        } else if (e.which == 3) {
            $(this).toggleClass("upsidedown");
        }

    }).mouseup(function (e) {
        if (e.which == 1) {
            if (new Date().getTime() - cardDragCountdown <= dragSensibility) {
                $(this).toggleClass("flipped");
            } else if (isMouseInElement(e, $("#deck"))) {
                $("#card-reveal-" + draggingCard).remove();
                cards.push(draggingCard);
            }
        }
        draggingCard = -1;
    });
}

function updateGhostPosition() {
    if (isDragging || startDragging) {
        $("#ghost-card").css({ width: cardRect.w, height: cardRect.h, left: cardCoos.x, top: cardCoos.y }).show();
    } else {
        $("#ghost-card").hide();
    }
}

function resetCards() {
    $(".card").remove();
    cards = [];
    maxCards = $("#cards-number").val() - 1;
    for (let i = 0; i < maxCards + 1; i++) {
        cards.push(i);
    }
    playedCards = [];

    showRemainingCards();
    cardRect.w = $("#cards-size-x").val();
    cardRect.h = $("#cards-size-y").val();

    //scale cards
    $("#deck").css({ width: (25 + Number(cardRect.w)), height: (25 + Number(cardRect.h) + 50) });
    $(".pick-card").css({ width: cardRect.w, height: cardRect.h });
    $(".decorative-card-1").css({ width: cardRect.w, height: cardRect.h });
    $(".decorative-card-2").css({ width: cardRect.w, height: cardRect.h });
    $(".decorative-card-3").css({ width: cardRect.w, height: cardRect.h });
    $(".decorative-card-4").css({ width: cardRect.w, height: cardRect.h });
    //scale cards

    localStorage.setItem("cardNumber", cards.length);
    localStorage.setItem("cardSize", JSON.stringify(cardRect));
    localStorage.setItem("ratio", ratio);

    $(".changes-warning").hide();
}

function getCard(forceVal) {
    if (forceVal) {
        let found = false;
        for (let i = 0; i < maxCards; i++) {
            if (cards[i] != null && cards[i] == forceVal) {
                newCard = cards.splice(i, 1)[0];
                found = true;
            }
        }
        if (!found) { return "error"; }
    } else {
        newCard = cards.splice(Math.floor(Math.random() * cards.length), 1)[0];
    }
    upsidedown = cardsRotate && Math.random() > .5;
    showRemainingCards();
}

function showRemainingCards() {
    $(".decorative-card-4").css({ display: cards.length > 4 ? "block" : "none" });
    $(".decorative-card-3").css({ display: cards.length > 3 ? "block" : "none" });
    $(".decorative-card-2").css({ display: cards.length > 2 ? "block" : "none" });
    $(".decorative-card-1").css({ display: cards.length > 1 ? "block" : "none" });
    $("#pick-card").css({ display: cards.length > 0 && !isDragging && !startDragging ? "block" : "none" });
}

function initCards() {
    if (localStorage.getItem("cardNumber")) {
        $("#cards-number").val(localStorage.getItem("cardNumber"));
    }
    if (localStorage.getItem("cardSize")) {
        cardRect = JSON.parse(localStorage.getItem("cardSize"));
        $("#cards-size-x").val(cardRect.w);
        $("#cards-size-y").val(cardRect.h);
    }
    if (localStorage.getItem("cardsRotate")) {
        cardsRotate = localStorage.getItem("cardsRotate") == "true";
        $("#toggle-rotable").prop('checked', cardsRotate);
        $("#toggle-rotable-desc").html(cardsRotate ? "Cards will randomly be upsidedown" : "Cards are always upright");
    }

    if (localStorage.getItem("ratio")) {
        ratio = localStorage.getItem("ratio");
        if (ratio > 0) {
            $("#display-ratio").html("Keep Ratio " + ratio);
        } else {
            $("#keep-ratio").prop("checked", false);
            $("#display-ratio").html("Not keeping a ratio");
        }
    }



    resetCards();
}