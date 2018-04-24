$(function () {
    var codeType = { "unknow": 0, "html": 1, "htmlWithNoIndent": 2, "javascript": 3, "css": 4, "php": 5 };
    var curCodeType = codeType.unknow;
    var nextCodeType = codeType.unknow;
    var cssList = {
        "html": {
            "bracket": "html-bracket",
            "tagName": "html-tagName",
            "attrName": "html-attr",
            "comment": "html-comment"
        },
        "javascript": {
            "keyword": "js-keyword",
            "string": "js-string",
            "comment": "js-comment",
        },
        "css": {
            "keyword": "css-keyword",
            "styleName": "css-styleName",
            "value": "css-value",
            "comment": "css-comment"
        }
    }
    var lineIndent = {
        "codeType": codeType.unknow,
        "indentDeepth": 0,
        "numOfSpacePerIndentDeepth": 4,
        "isComment": false,
        "endOfComent": false,
        "js-indentDeepth": 1
    }
    var keywordList = {
        "html": [
            "html", "head", "meta"
        ],
        "javascript": [
            "break", "case", "catch", "continue",
            "default", "delete", "do", "else", "false",
            "for", "function", "if", "in", "instanceof",
            "new", "null", "return", "super", "switch",
            "this", "throw", "true", "try", "typeof", "var", "while", "with"
        ]
    }
    var jsSymbol = {
        "lr": ["&", "&&", "||", "|", "+", "-", "*", "/", "==", "=", "%", "?"],
        "l": ["(", "{"],
        "r": [":"],
        "none": [";"]
    }

    var regStr = {
        "attrValue": "[a-z0-9\\s\\/\\-\\._;\(\):]",//字母数字+部分符号
        "attrValueWithChinese": "(([a-z0-9\\s\\/\\-\\._;\(\):]*[\u4E00-\u9FA5\uF900-\uFA2D]*)+)",
        "ChineseWord": "[\u4E00-\u9FA5\uF900-\uFA2D]"
    }

    var codeTypeRegList = {
        "html": {
            "begin": new RegExp("^&lt;\\w+", "i"),
            "end": new RegExp("(&lt;/\w+&gt;|/&gt;)\s*", "i"),
            "tagName1": new RegExp("<span class='" + cssList.html.bracket + "'>&lt;</span>\\w+\\s+", "gi"),// <div class='***'>...
            "tagName2": new RegExp("<span class='" + cssList.html.bracket + "'>&lt;</span>\\w+<span class='" + cssList.html.bracket + "'>\&gt;</span>", "gi"),// <head>
            "tagName3": new RegExp("<span class='" + cssList.html.bracket + "'>&lt;/</span>\\w+<span class='" + cssList.html.bracket + "'>\&gt;</span>", "gi"),// </head>
            "comment": new RegExp("^&lt;!--", "i"),// <!-- comment -->
            "attrName": new RegExp("\\s+\\S+\\s*=\\s*(\"" + regStr.attrValueWithChinese + "+\"|'" + regStr.attrValueWithChinese + "+')", "gi"),// class="js-sd"
            "indent": {
                "indent1": new RegExp("&lt;\\S+[^>]*/&gt;", "i"), // <script type="text/javascript" defer="defer"/>
                "indent2": new RegExp("&lt;(\\S+)(\\s+\\S+=\"\\S+\")*&gt;.*&lt;\/\\1&gt;", "i"),//new RegExp("&lt;(\\S+)\\s+[^(&gt;)]+&gt;&lt;/\\1&gt;", "i"), // <script type="text/javascript" defer="defer"></script>
                "indent3": new RegExp("&lt;(\\S+)&gt;.*&lt;/\\1&gt;", "i"), // <title>Hello</title>
                "indent4": new RegExp("&lt;/\\S+&gt;", "i"), // </head>
                "indent5": new RegExp("&lt;\\S+.*&gt;", "i"), // <div class='123'>
            }
        },
        "js": {
            "begin": new RegExp("^&lt;script", "i"),
            "end": new RegExp("&lt;/script&gt;", "i"),
            "string": /(("([^"]*\\"[^"]*)+"|"[^"]*")|('([^']*\\'[^']*)+'|'[^']*'))/g,
            "comment": {
                "full": new RegExp("^(//.*|///.*|/\\*.*\\*/)", "i"),// // comment here
                "half": new RegExp("(//.*|///.*|/\\*.*\\*/)", "i"),// var str = "comment";// comment here
                "halfBegin": new RegExp("/\\*.*", "i"), // var str= "comment";/* comment
            }
        },
        "css": {
            "begin": new RegExp("^&lt;style", "i"),
            "end": new RegExp("&lt;/style&gt;$", "i"),
            "string": /(("([^"]*\\"[^"]*)+"|"[^"]*")|('([^']*\\'[^']*)+'|'[^']*'))/g,
            "keyword": new RegExp("^^[.#]?\\S+\\S*\\s*(&lt;)?.?(&gt;)?\\s*\\S*(?={)", "i"),
            "styleName": new RegExp("^\\S+(?=:)", "i"),
            "comment": {
                "full": new RegExp("/\\*.*\\*/", "i"),
                "half": new RegExp("/\\*.*", "i"),
            }
        },
        "php": {
            "begin": new RegExp("^&lt;?php", "i"),
            "end": new RegExp("/?&gt;$", "i")
        },
        "common": {
            "firstWordOfLine": /^\w+\b/gi,
        }
    };

    $("code.codeLight-html").each(function () {
        var fileName = $(this).attr("CL-FileName");
        var htmlStr = "<table class='code-tb'>";
        var codeArr = $(this).text().trim().split("\n");
        htmlStr += "<tr><td rowspan='" + (codeArr.length + 1) + "' class='code-tb-border'></td><td></td><td class='code-tb-info'>" + fileName + "<a class='code-tb-info-copy'><i class='fa fa-copy' title='复制代码' onclick='copyCode(this);'></i></a></td>";
        var numLine = 1;
        for (var i = 1; i <= codeArr.length; i++) {
            htmlStr += "<tr class='code-db-line'><td class='code-tb-order'>" + numLine.toString() + "</td><td class='code-td'>";
            var curLine = codeArr[i - 1].trim().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\s+/g, " ");
            htmlStr += renderCodeLine(curLine);
            htmlStr += "</td></tr>";
            numLine++;
        }
        htmlStr += "</table>";
        $(this).html(htmlStr);
    });

    $("code.codeLight-css").each(function () {
        var fileName = $(this).attr("CL-FileName");
        var htmlStr = "<table class='code-tb'>";
        var codeArr = $(this).text().trim().split("\n");
        htmlStr += "<tr><td rowspan='" + (codeArr.length + 1) + "' class='code-tb-border'></td><td></td><td class='code-tb-info'>" + fileName + "<a class='code-tb-info-copy'><i class='fa fa-copy' title='复制代码' onclick='copyCode(this);'></i></a></td>";
        var numLine = 1;
        for (var i = 1; i <= codeArr.length; i++) {
            htmlStr += "<tr class='code-db-line'><td class='code-tb-order'>" + numLine.toString() + "</td><td class='code-td'>";
            var curLine = codeArr[i - 1].trim().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\s+/g, " ");
            htmlStr += renderCodeLine(curLine, false, codeType.css);
            htmlStr += "</td></tr>";
            numLine++;
        }
        htmlStr += "</table>";
        $(this).html(htmlStr);
    });

    $("code.codeLight-js").each(function () {
        var fileName = $(this).attr("CL-FileName");
        var htmlStr = "<table class='code-tb'>";
        var codeArr = $(this).text().trim().split("\n");
        htmlStr += "<tr><td rowspan='" + (codeArr.length + 1) + "' class='code-tb-border'></td><td></td><td class='code-tb-info'>" + fileName + "<a class='code-tb-info-copy'><i class='fa fa-copy' title='复制代码' onclick='copyCode(this);'></i></a></td>";
        var numLine = 1;
        for (var i = 1; i <= codeArr.length; i++) {
            htmlStr += "<tr class='code-db-line'><td class='code-tb-order'>" + numLine.toString() + "</td><td class='code-td'>";
            var curLine = codeArr[i - 1].trim().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\s+/g, " ");
            htmlStr += renderCodeLine(curLine, false, codeType.javascript);
            htmlStr += "</td></tr>";
            numLine++;
        }
        htmlStr += "</table>";
        $(this).html(htmlStr);
    });

    function getCurCodeBlockType(codeStr) {
        var v = codeStr.trim();
        var result = codeType.unknow;
        if (codeTypeRegList.js.begin.test(v)) {
            ///js begin
            if (codeTypeRegList.js.end.test(v)) {
                //eg: <script>console.log("hello world");</script>
                //todo

            } else {
                curCodeType = codeType.html;
                nextCodeType = codeType.javascript;
                //console.log(v + " " + "js begin");
            }
        } else if (codeTypeRegList.js.end.test(v)) {
            ///js end
            curCodeType = nextCodeType = codeType.html;
            //console.log(v + " " + "js end");
        } else if (codeTypeRegList.css.begin.test(v)) {
            ///css begin
            curCodeType = codeType.html;
            nextCodeType = codeType.css;
            //console.log(v + " " + "css begin");
        } else if (codeTypeRegList.css.end.test(v)) {
            ///css end
            curCodeType = nextCodeType = codeType.html;
            //console.log(v + " " + "css end");
        } else if (codeTypeRegList.html.begin.test(v)) {
            ///html
            curCodeType = nextCodeType = codeType.html;
            //console.log(v + " " + "html begin");
        } else if (v.indexOf("&lt;!DOCTYPE") >= 0) {
            /// <!DOCTYPE html>
            curCodeType = codeType.htmlWithNoIndent;
        }
        else {
            curCodeType = nextCodeType;
            //console.log(v + " " + "unknow but curCodeType="+curCodeType);
        }
        return curCodeType;
    }

    function renderCodeLine(str, ignoreIndent, specifyCodeType) {
        var result = str.trim();
        var type = specifyCodeType != null ? specifyCodeType : getCurCodeBlockType(result);
        var reg = new RegExp();
        var indentStr = ignoreIndent ? "" : calLineIndent(type, str.trim());
        switch (type) {
            case codeType.html:
                {
                    if (codeTypeRegList.html.comment.exec(str) || lineIndent.isComment) {
                        result = "<span class='" + cssList.html.comment + "'>" + result + "</span>";
                        break;
                    }
                    result = result.replace(/&lt;/g, "<span class='" + cssList.html.bracket + "'>&lt;</span>");// <
                    result = result.replace(/&gt;/g, "<span class='" + cssList.html.bracket + "'>&gt;</span>");// >
                    result = result.replace(new RegExp("/<span class='" + cssList.html.bracket + "'>&gt;</span>", "gi"), "<span class='" + cssList.html.bracket + "'>/&gt;</span>");// />
                    result = result.replace(new RegExp("<span class='" + cssList.html.bracket + "'>&lt;</span>/", "gi"), "<span class='" + cssList.html.bracket + "'>&lt;/</span>");// </

                    //tagName2: <div class='123'>
                    var tagName1Fix = result.match(codeTypeRegList.html.tagName1);
                    if (tagName1Fix != null && tagName1Fix.length > 0) {
                        for (var i = 0; i < tagName1Fix.length; i++) {
                            var curItem = tagName1Fix[i];
                            var tagName = tagName1Fix[i].trim().replace("<span class='" + cssList.html.bracket + "'>&lt;</span>", "");
                            result = result.replace(new RegExp(tagName1Fix[i], "gi"), "<span class='" + cssList.html.bracket + "'>&lt;</span><span class='html-tagName'>" + tagName + "</span> ");
                        }
                    }

                    //tagName2: <head>
                    var tagName2Fix = result.match(codeTypeRegList.html.tagName2);
                    if (tagName2Fix != null && tagName2Fix.length > 0) {
                        for (var i = 0; i < tagName2Fix.length; i++) {
                            var tagName = tagName2Fix[i].trim().replace("<span class='html-bracket'>&lt;</span>", "").replace("<span class='html-bracket'>&gt;</span>", "");
                            reg = new RegExp(tagName2Fix[i], "gi");
                            result = result.replace(reg, "<span class='" + cssList.html.bracket + "'>&lt;</span><span class='html-tagName'>" + tagName + "</span><span class='" + cssList.html.bracket + "'>&gt;</span>");
                        }
                    }

                    var tagName3Fix = result.match(codeTypeRegList.html.tagName3);
                    if (tagName3Fix != null && tagName3Fix.length > 0) {
                        for (var i = 0; i < tagName3Fix.length; i++) {
                            var tagName = tagName3Fix[i].trim().replace(/&lt;/gi, "").replace(/&gt;/gi, "");
                            reg = new RegExp(tagName3Fix[i], "gi");
                            result = result.replace(reg, "<span class='" + cssList.html.bracket + "'>&lt;</span><span class='html-tagName'>" + tagName + "</span><span class='" + cssList.html.bracket + "'>&gt;</span>");
                        }
                    }


                    var attrNameArr = result.match(codeTypeRegList.html.attrName);
                    if (attrNameArr != null && attrNameArr.length > 0) {
                        for (var i = 0; i < attrNameArr.length; i++) {
                            var curItem = attrNameArr[i].trim();
                            if (!isAttrFromRender(curItem)) {
                                var attrName = curItem.substr(0, curItem.indexOf("="));
                                reg = new RegExp("(\"" + regStr.attrValueWithChinese + "+\"|'" + regStr.attrValueWithChinese + "+')", "gi");
                                var attrValue = curItem.match(reg)[0];
                                attrValue = attrValue.substr(1, attrValue.length - 2);
                                result = result.replace(curItem, "<span class='" + cssList.html.attrName + "'>" + attrName + "</span><span class='" + cssList.html.bracket + "'>=\"" + attrValue + "\"</span>");
                            }
                        }
                    }

                    /*
                    var _s = result.replace(/<span class='html-bracket'>&lt;<\/span><span class='html-tagName'>(\S*)<\/span>/i, "").replace(/<span class='html-bracket'>&gt;<\/span>/, "");
                    var attrArr = _s.trim().split(" ");
                    if (attrArr != null && attrArr.length > 0) {
                        for (var i = 0; i < attrArr.length; i++) {
                            var curItem = attrArr[i];
                            var attrName = curItem.substr(0, curItem.indexOf("="));
                            var attrValue = curItem.substr(curItem.indexOf(attrName) + attrName.length + 2, curItem.length - curItem.indexOf(attrName) - attrName.length - 3);
                            result = result.replace(curItem, "<span class='" + cssList.html.attrName + "'>" + attrName + "</span><span class='" + cssList.html.bracket + "'>=\"" + attrValue + "\"</span>");
                        }
                    }
                    */
                }
                break;
            case codeType.htmlWithNoIndent:
                result = result.replace("html", "<span class='" + cssList.html.attrName + "'>html</span>");
                result = result.replace("&lt;!", "<span class='" + cssList.html.bracket + "'>&lt;!</span>").replace("&gt;", "<span class='" + cssList.html.bracket + "'>&gt;</span>");
                result = result.replace("DOCTYPE", "<span class='" + cssList.html.tagName + "'>DOCTYPE</span>");
                break;
            case codeType.javascript:
                {
                    if (lineIndent.isComment) {
                        result = "<span class='" + cssList.javascript.comment + "'>" + result + "</span>";
                        break;
                    }
                    // 1.first replace string with mask
                    var stringArr = result.match(codeTypeRegList.js.string);
                    if (stringArr != null && stringArr.length > 0) {
                        for (var i = 0; i < stringArr.length; i++) {
                            var curStr = stringArr[i].substr(1, stringArr[i].length - 2);
                            var curStrMask = strPower(i.toString(), curStr.length);
                            result = result.replace(stringArr[i], '"' + curStrMask + '"')
                        }
                    }
                    // 2.then replace comment with mask
                    // 2.1 full comment
                    var comArr = result.match(codeTypeRegList.js.comment.half);
                    if (comArr != null && comArr.length > 0) {
                        for (var i = 0; i < comArr.length; i++) {
                            var curStr = comArr[0];
                            result = result.replace(curStr, strPower("@", curStr.length));
                        }
                    }
                    // normalize js str
                    /*
                    for (var item in jsSymbol.lr) {
                        var curItem = jsSymbol.lr[item];
                        if (result.indexOf(curItem) >= 0) {
                            reg = new RegExp("\s*\\" + curItem + "\s*", "gi");
                            result = result.replace(reg, "&nbsp;" + curItem + "&nbsp;");
                        }
                    }
                    */

                    //string
                    if (stringArr != null && stringArr.length > 0) {
                        for (var i = 0; i < stringArr.length; i++) {
                            var curStr = stringArr[i];
                            var curStrMask = strPower(i.toString(), curStr.length - 2);
                            result = result.replace('"' + curStrMask + '"', "<span class='" + cssList.javascript.string + "'>" + curStrMask + "</span>");
                        }
                    }

                    //recover comment
                    if (comArr != null && comArr.length > 0) {
                        for (var i = 0; i < comArr.length; i++) {
                            result = result.replace(strPower("@", comArr[i].length), "<span class='" + cssList.javascript.comment + "'>" + comArr[i] + "</span>");
                        }
                    }

                    //keyword
                    //1. exception: else if
                    result = result.replace("else if", "<span class='" + cssList.javascript.keyword + "'>else if</span>");

                    //2.only get first word
                    var fw = result.match(codeTypeRegList.common.firstWordOfLine);
                    if (fw != null && fw.length > 0) {
                        var word = fw[0];
                        if (isWordIsKeyWord(word, codeType.javascript)) {
                            result = "<span class='" + cssList.javascript.keyword + "'>" + word + "</span>" + result.substr(word.length, result.length - word.length);
                        }
                    }
                    //3.new eg:var i = new date();
                    result = result.replace("new", "<span class='" + cssList.javascript.keyword + "'>new</span>");

                    //recover string mask
                    if (stringArr != null && stringArr.length > 0) {
                        for (var i = 0; i < stringArr.length; i++) {
                            var curStr = stringArr[i];
                            var curStrMask = strPower(i.toString(), curStr.length - 2);
                            result = result.replace("<span class='" + cssList.javascript.string + "'>" + curStrMask + "</span>", "<span class='" + cssList.javascript.string + "'>" + curStr + "</span>");
                        }
                    }

                    result = result.replace("/\\s+/", " ");
                }
                break;
            case codeType.css:
                {
                    if (lineIndent.isComment) {
                        result = "<span class='" + cssList.css.comment + "'>" + result + "</span>";
                        break;
                    }

                    //1.first replace string with mask
                    var stringArr = result.match(codeTypeRegList.css.string);
                    if (stringArr != null && stringArr.length > 0) {
                        for (var i = 0; i < stringArr.length; i++) {
                            result = result.replace(stringArr[i], strPower(i.toString(), stringArr[i].length));
                        }
                    }

                    //2.then replace comment with mask
                    var comArr = result.match(codeTypeRegList.css.comment.full);
                    if (comArr != null && comArr.length > 0) {
                        for (var i = 0; i < comArr.length; i++) {
                            result = result.replace(comArr[i], strPower("@", comArr[i].length));
                        }
                    }

                    //keyword
                    var kw = result.match(codeTypeRegList.css.keyword);
                    if (kw != null && kw.length > 0) {
                        for (var i = 0; i < kw.length; i++) {
                            result = result.replace(kw[i], "<span class='" + cssList.css.keyword + "'>" + kw[i] + "</span>");
                        }
                    }

                    //styleName
                    var sn = result.match(codeTypeRegList.css.styleName);
                    if (sn != null && sn.length > 0) {
                        for (var i = 0; i < sn.length; i++) {
                            result = result.replace(sn[i], "<span class='" + cssList.css.styleName + "'>" + sn[i] + "</span>");
                        }
                    }

                    //value
                    var valueArr = result.split("</span>:");
                    if (valueArr != null && valueArr.length > 1) {
                        var curValueStr = valueArr[1];
                        if (curValueStr[curValueStr.length - 1] == "}") {
                            curValueStr = curValueStr.substr(0, curValueStr.length - 1);
                        }
                        if (curValueStr[curValueStr.length - 1] == ";") {
                            curValueStr = curValueStr.substr(0, curValueStr.length - 1);
                        }
                        var curValueArr = curValueStr.split(",");
                        if (curValueArr.length <= 1) {
                            result = result.replace(curValueStr, "<span class='" + cssList.css.value + "'>" + curValueStr + "</span>");
                        } else {
                            for (var i = 0; i < curValueArr.length; i++) {
                                result = result.replace(curValueArr[i], "<span class='" + cssList.css.value + "'>" + curValueArr[i] + "</span>");
                            }
                        }
                    }

                    //recover comment
                    if (comArr != null && comArr.length > 0) {
                        result = result.replace(strPower("@", comArr[0].length), "<span class='" + cssList.css.comment + "'>" + comArr[0] + "</span>");
                    }

                    //recover string mask
                    if (stringArr != null && stringArr.length > 0) {
                        for (var i = 0; i < stringArr.length; i++) {
                            var curStr = stringArr[i];
                            var curStrMask = strPower(i.toString(), curStr.length);
                            result = result.replace(curStrMask, "<span class='" + cssList.css.value + "'>" + curStr + "</span>");
                        }
                    }

                    //
                    var _str = cleanJSComment(str);
                    if (_str.indexOf("{") > 0 && _str.indexOf("}") > _str.indexOf("{")) {
                        //case : div.p {color:red;font-size:12px;}
                        var _tmpArr = _str.split("{");
                        if (_tmpArr != null && _tmpArr.length > 1 < 0) {
                            var _tmpArr2 = _tmpArr[1].split(";");
                            for (var j = 0; j < _tmpArr2.length; j++) {
                                var curS = _tmpArr2[j];
                                result = result.replace(curS, renderCodeLine(curS, true));
                            }
                        }
                    } else if (_str.indexOf("{") > 0 && _str.indexOf("}") < 0) {
                        var _tmpArr = _str.split("{");
                        if (_tmpArr != null && _tmpArr.length > 1) {
                            var _tmpArr2 = _tmpArr[1].split(";");
                            for (var j = 0; j < _tmpArr2.length; j++) {
                                var curS = _tmpArr2[j];
                                result = result.replace(curS, renderCodeLine(curS, true));
                            }
                        }
                    } else if (_str.indexOf("}") > 0 && _str.indexOf("{") < 0) {
                        var _tmpArr = _str.split("}");
                        if (_tmpArr != null && _tmpArr.length > 1) {
                            var _tmpArr2 = _tmpArr[0].split(";");
                            for (var j = 0; j < _tmpArr2.length; j++) {
                                var curS = _tmpArr2[j];
                                result = result.replace(curS, renderCodeLine(curS, true));
                            }
                        }
                    }
                }
                break;
            default:

                break;
        }
        return indentStr + result;
    }
    function isAttrFromRender(str) {
        var isFrom = false;
        //class="html-bracket" or ...
        for (var listBlock in cssList) {
            for (var cssItem in cssList[listBlock]) {
                if (str.indexOf("class='" + cssList[listBlock][cssItem] + "'") >= 0 || str.indexOf('class="' + cssList[listBlock][cssItem] + '"') >= 0) {
                    isFrom = true;
                    break;
                }
            }
        }
        return isFrom;
    }
    function isWordIsKeyWord(w, curCodeType) {
        var result = false;
        switch (curCodeType) {
            case codeType.html:

                break;
            case codeType.javascript:
                for (var i = 0; i < keywordList.javascript.length; i++) {
                    if (keywordList.javascript[i] == w) {
                        result = true;
                        break;
                    }
                }
                break;
            case codeType.css:

                break;
        }
        return result;
    }
    function calLineIndent(curCodeType, str) {
        lineIndent.codeType = curCodeType;
        var curIndentDeep = lineIndent.indentDeepth;

        if (lineIndent.endOfComent) {
            lineIndent.isComment = lineIndent.endOfComent = false;
        }
        switch (curCodeType) {
            case codeType.html:
                {
                    if (str.length >= 6 && str.substr(str.length - 6, 6) == "--&gt;") {
                        ///-->
                        ///end of comment
                        lineIndent.endOfComent = lineIndent.isComment = true;
                    }

                    if (!lineIndent.isComment) {
                        if (codeTypeRegList.html.indent.indent1.test(str) || codeTypeRegList.html.indent.indent2.test(str) || codeTypeRegList.html.indent.indent3.test(str)) {
                            /// <head></head> 
                            /// same indent deepth
                        } else if (str.match(/^&lt;(img|input).*&gt;$/gi)) {
                            //<img src="xxx.jpg"> or <input ...>
                            // no indent
                        }
                        else if (codeTypeRegList.html.comment.test(str)) {
                            if (str.length > 6 && str.substr(str.length - 6, 6) == "--&gt;") {
                                /// <!-- Comment -->
                            } else {
                                /// or <!-- comment
                                lineIndent.isComment = true;
                            }
                        }
                        else if (codeTypeRegList.html.indent.indent4.test(str)) {
                            /// </head> 
                            /// end a indent deepth
                            lineIndent.indentDeepth > 0 ? lineIndent.indentDeepth -= 1 : "";
                            curIndentDeep = lineIndent.indentDeepth;
                        } else if (codeTypeRegList.html.indent.indent5.test(str)) {
                            /// <div class="123">
                            /// increase a indent deepth
                            lineIndent.indentDeepth += 1;
                        }
                    }
                }
                break;
            case codeType.htmlWithNoIndent:
                curIndentDeep = lineIndent.indentDeepth = 0;
                break;
            case codeType.javascript:
                {
                    if (str.substr(str.length - 2, 2) == "*/" && str.indexOf("/*") <= 0) {
                        /// any */
                        /// end js comment
                        lineIndent.endOfComent = lineIndent.isComment = true;
                    }

                    if (!lineIndent.isComment) {
                        var _str = cleanJSComment(str);
                        if (codeTypeRegList.js.comment.full.test(str)) {
                            /// eg: //comment
                            /// eg: /* any */
                        }
                        else if (codeTypeRegList.js.comment.halfBegin.test(str)) {
                            if (str.substr(str.length - 2, 2) == "*/" || _str.length > 0) {
                                /* 123 */

                            } else {
                                /* eg: /*   */
                                lineIndent.isComment = true;
                            }
                        }

                        if (_str.substr(_str.length - 1, 1) == "{") {
                            lineIndent.indentDeepth += 1;
                        } else if (_str.substr(_str.length - 1, 1) == "}"
                            || (_str.match(/\}\s*\)\s*;/gi) && !_str.match(/\(\s*\{/gi)) // })
                            || (_str.match(/\}\s*,$/gi) && _str.indexOf("{") < 0) // },
                            ) {
                            lineIndent.indentDeepth > 0 ? lineIndent.indentDeepth -= 1 : "";
                            curIndentDeep = lineIndent.indentDeepth;
                        }
                    }
                }
                break;
            case codeType.css:
                {
                    if (str.substr(str.length - 2, 2) == "*/" && str.indexOf("/*") <= 0) {
                        /// any */
                        /// end css comment
                        lineIndent.endOfComent = lineIndent.isComment = true;
                    }

                    if (!lineIndent.isComment) {
                        var _str = cleanJSComment(str);
                        if (codeTypeRegList.js.comment.full.test(str)) {
                            /// eg: //comment
                            /// eg: /* any */
                        }
                        else if (codeTypeRegList.js.comment.halfBegin.test(str)) {
                            if (str.substr(str.length - 2, 2) == "*/" || _str.length > 0) {
                                /* 123 */

                            } else {
                                /* eg: /*   */
                                lineIndent.isComment = true;
                            }
                        }

                        if (_str.indexOf("{") >= 0 && _str.indexOf("}") < 0) {
                            lineIndent.indentDeepth += 1;
                        } else if (_str.indexOf("{") >= 0 && _str.indexOf("}") >= 0) {

                        }
                        else if (_str.indexOf("}") >= 0) {
                            lineIndent.indentDeepth > 0 ? lineIndent.indentDeepth -= 1 : "";
                            curIndentDeep = lineIndent.indentDeepth;
                        }
                    }
                }
                break;
        }
        return strPower("&nbsp;", curIndentDeep * lineIndent.numOfSpacePerIndentDeepth);
    }
    function strPower(w, t) {
        if (typeof (w) == "string" && typeof (t) == "number") {
            var r = "";
            for (var i = 0; i < t; i++) {
                r += w;
            }
            return r;
        } else {
            return "";
        }
    }

    function cleanJSComment(str) {
        var result = str.trim();
        var reg = new RegExp("(//.*|///.*|/\\*.*\\*/)", "i");
        ///only match as follow:
        ///1. //this is comment
        ///2. var i = 0;//comment
        ///3. ///comment
        ///4. var i = 0;///comment
        ///5. /* comment*/
        ///6. var i = 0;/* comment */
        ///Lose match:
        ///var i = 0;/*comment
        result = result.replace(reg, "");

        //handle lose match case
        if (result.indexOf("/*") == 0) {
            result = "";
        } else if (result.indexOf("/*") > 0) {
            result = result.substr(0, result.length - (result.indexOf("/*") + 2));
        }
        return result;
    }
});

function copyCode(el) {
    $table = $(el);
    var maxRunTime = 10;
    var result = "";
    while (!$table.hasClass("code-tb") && maxRunTime > 0) {
        $table = $($table.parent());
        maxRunTime--;
    }
    if (!!$table) {
        var result = ""
        $table.find("tr.code-db-line").each(function () {
            result += $(this).text().trim().replace(/^\d+\s*/, "");
            result += "\n"
        });
    }
    console.log(result);
}
