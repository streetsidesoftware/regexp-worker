export type Range = [number, number];
export type Segment = [Range, Range];
export type ContentMap = Segment[];

/**
 *
 * @param innerText - the inner text of an element
 * @param innerContent - the inner content of an element, may include special characters
 */
export function compareContent(innerText: string, innerContent: string) {
    const map: ContentMap = [];

    let tI = 0;
    let cI = 0;
    let lastTI = 0;
    let lastCI = 0;

    for (; tI < innerText.length && cI < innerContent.length; tI++, cI++) {
        if (innerText[tI] !== innerContent[cI]) {
            addSegment();
            findMatch();
            addSegment();
        }
    }

    tI = innerText.length;
    cI = innerContent.length;

    addSegment();
    return map;

    function findMatch() {
        let t = tI;
        let c = cI;
        while (t < innerText.length && c < innerContent.length) {
            if (innerText[t] === innerContent[cI]) {
                // Match found by moving t forward
                tI = t;
                return;
            }
            if (innerText[tI] === innerContent[c]) {
                // Match found by moving c forward
                cI = c;
                return;
            }
            ++t;
            ++c;
        }
        // No match found, pick one.
        if (t < innerText.length) {
            cI = c;
        } else {
            tI = t;
        }
    }

    function addSegment() {
        if (lastTI < tI || lastCI < cI) {
            map.push([
                [lastTI, tI],
                [lastCI, cI],
            ]);
            lastTI = tI;
            lastCI = cI;
        }
    }
}
