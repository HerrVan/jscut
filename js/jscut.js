// Copyright 2014 Todd Fleming

var materialViewModel = new MaterialViewModel();
ko.applyBindings(materialViewModel);

var mainSvg = Snap("#MainSvg");
var content;
var selectionGroup;
var materialSvg = Snap("#MaterialSvg");

function updateSvgAutoHeight() {
    $("svg.autoheight").each(function () {
        internalWidth = $(this).attr("internalWidth");
        internalHeight = $(this).attr("internalHeight");
        $(this).height($(this).width() * internalHeight / internalWidth);
    });
}

$(function () {
    updateSvgAutoHeight();
    $(window).resize(updateSvgAutoHeight);
});


var nextAlertNum = 1;
function showAlert(message, alerttype) {
    var alertNum = nextAlertNum++;
    $('#alert_placeholder').prepend('<div id="AlertNum' + alertNum + '" class="alert ' + alerttype + '"><a class="close" data-dismiss="alert">&times;</a>' + message + '</div>')
    setTimeout(function () {
        $("#AlertNum" + alertNum).remove();
    }, 5000);
}

function selectPath(elem) {
    if (elem.attr("SelectedPath") == "true") {
        elem.remove();
        return;
    }

    var path = getLinearSnapPathFromElement(elem, 1, 3, function (msg) {
        showAlert(msg, "alert-warning");
    });

    if (path != null)
        selectionGroup.path(path).attr({ "SelectedPath": "true", "style": "fill:#0000ff" });
}

Snap.load("Material.svg", function (f) {
    materialSvg.append(f);
    materialViewModel.materialSvg(materialSvg);
});

Snap.load("test.svg", function (f) {
    content = mainSvg.group();
    content.append(f);
    content.attr("filter", mainSvg.filter(Snap.filter.contrast(.5)));
    selectionGroup = mainSvg.g(mainSvg.circle(10, 10, 100, 100));
});

$("#MainSvg").click(function (e) {
    selectPath(Snap.getElementByPoint(e.pageX, e.pageY));
});
