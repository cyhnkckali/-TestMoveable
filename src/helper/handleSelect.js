
let patternTranslate = /translate\((-?\d+(\.\d+)?|\.\d+)(px)?,\s*(-?\d+(\.\d+)?|\.\d+)(px)?\)/;
let patternRotate = /rotate\((-?\d+(\.\d+)?|\.\d+)(deg)?\)/;




/**
 * @param list type Array 'in target class or id'
 */
export const getSelectedData = (list) => {
    const data = []
    list.forEach(item => {
        let ItemProperty = {
    
            id: null,
            left: null,
            top: null,
            width: null,
            height: null,
            rotation: null,
            transformOrigin:null,
        }

    
        ItemProperty.id = item.dataset.selectorElementId;       
        ItemProperty.height = item.offsetHeight;
        ItemProperty.width = item.offsetWidth;
        ItemProperty.transformOrigin=item.style.transformOrigin;

        

        let transform = item.style.transform
     
        if (transform.includes('translate')) {
            let matches = item.style.transform.match(patternTranslate);
            ItemProperty.left = parseFloat(matches[1]);
            ItemProperty.top = parseFloat(matches[4]);
        } else {
            ItemProperty.left = 0;
            ItemProperty.top = 0;
        }

        if (transform.includes('rotate')) {
            let matches = item.style.transform.match(patternRotate);
            ItemProperty.rotation = parseFloat(matches[1]);
        } else {
            ItemProperty.rotation = 0;
        }

        data.push(ItemProperty)
    });

    try {
        window.chrome.webview.postMessage('@FB_Components_Value_Changed@'+JSON.stringify(data))
    } catch (error) {
    }

}



export default { getSelectedData }