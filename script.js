// Definition
var 
    playerName = 0,
    jailtime_total = 0,
    fine_total = 0,
    bail_total = 0,
    max_jailtime = 480,
    max_fine = 10000,
    max_bail = 25000
;

var 
    chargeData = [],
    addedChargeData = [],
    searchChargeIndex = []
;

function viewData() {
    console.log('added charge index list on session');
    let retrievedChargeString = sessionStorage.getItem('addedCharge');
    let retrievedCharge = JSON.parse(retrievedChargeString);
    console.log(retrievedCharge);
    console.log('added charge index list');
    console.log(addedChargeData);
    console.log('multi search index list');
    console.log(searchChargeIndex);
}

async function loadChargeData() {
    const response = await fetch('data.json');
    chargeData = await response.json();
}

function loadTableData() {
    const tableBody = document.getElementById('chargeTableBody');
    tableBody.innerHTML = '';

    chargeData.forEach((item, index) => {
        let code = splitChargeCode(item.charge).Code;
        let linkCode = linkHandler(code);
        let charge = splitChargeCode(item.charge).Charge;
        let fineFormat = parseFloat(item.fine).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        let bailFormat = parseFloat(item.bail).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        chargeData[index] = {...item, chargeName: charge};
        const row = document.createElement('tr');
        row.dataset.index = index;

        row.innerHTML = `
            <td translate="no" onclick="copyPureCharge(${index})" class="selectable-text" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Click to copy">${code}</td>
            <td translate="no">${charge}${code === '' ? '' : `
                <a href="https://police.san-andreas.net/viewtopic.php?t=148639#:~:text=${linkCode}"target="_blank" rel="noopener noreferrer">
                    <i class="bi bi-link-45deg"></i>
                </a>
            `}
            </td>
            <td translate="no">${item.jailtime > 0 ? item.jailtime : '-'}</td>
            <td translate="no">${item.fine > 0 ? fineFormat : '-'}</td>
            <td translate="no">${item.bail > 0 ? bailFormat : '-'}</td>
            <td><button onclick="AddCharge(${index})" class="btn btn-primary add-btn" id="add-btn-${index}">ADD</i></button></td>
        `;
        
        tableBody.appendChild(row);
    });

    initTooltip();
    loadChargeTable();
    if(sessionStorage.getItem("s_playerName") !== null) {
        let playerInput = document.getElementById('playerName');
        playerName = sessionStorage.getItem("s_playerName");
        if(playerName === '0') {
            sessionStorage.removeItem('s_playerName');
            playerInput.value = '';
        } else {
            playerInput.value = playerName;
            updateName(playerName);
        }
    }

    document.body.style.visibility = 'visible';
}

(async () => {
    await loadChargeData();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadTableData);
    } else {
        loadTableData();
    }
})();

// load the added charge table from session
function loadChargeTable() {
    if(sessionStorage.getItem('addedCharge') === null) return;
    
    // Merging addedCharge session variable to local var
    let retrievedChargeString = sessionStorage.getItem('addedCharge');
    let retrievedCharge = JSON.parse(retrievedChargeString);
    addedChargeData = retrievedCharge;
    addedChargeData = [...new Set(addedChargeData)];
    
    for (let i = 0; i < addedChargeData.length; i++) {
        const element = addedChargeData[i];
        AddCharge(element, false);
    }
}

// Add Charge
function AddCharge(index, button = true) {
    if (!Number.isInteger(index)) {
        throw new Error("'index' only accepts an integer.");
    }

    let buttonId = 'add-btn-' + index;
    let add_button = document.getElementById(buttonId);
    add_button.disabled = true;

    if (button === true) {
        if (addedChargeData.includes(index)) {
            console.log('Data sudah ada di tabel seleksi.');
            return;
        }

        // Sort ID and store to session
        addedChargeData.push(index);
        addedChargeData.sort((a, b) => a - b);
        sessionStorage.setItem('addedCharge', JSON.stringify(addedChargeData));
    }

    const item = chargeData[index];

    const selectedTableBody = document.getElementById('selectedChargeTableBody');

    let code = splitChargeCode(item.charge).Code;
    let charge = splitChargeCode(item.charge).Charge;
    let fineFormat = item.fine > 0 ? parseFloat(item.fine).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-';
    let bailFormat = item.bail > 0 ? parseFloat(item.bail).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-';

    let newRow = document.createElement('tr');
    newRow.dataset.index = index; // Save index to row for sorting reference

    newRow.innerHTML = `
        <td translate="no" class="index" hidden>${index}</td>
        <td translate="no" onclick="copyPureCharge(${index})" class="selectable-text" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-title="Click to copy">${code}</td>
        <td translate="no" id="charge-${index}" onclick="copyCharge(${index})" class="selectable-text charge-td" title="${item.charge}">${charge}</td>
        <td translate="no" class="jailtime">${jailtimeInfo(index)}</td>
        <td translate="no" class="fine">${fineFormat}</td>
        <td translate="no" class="bail">${bailFormat}</td>
        <td><button onclick="copyCharge(${index})" class="btn btn-secondary">COPY</button></td>
        <td><button onclick="removeCharge(this, '${index}')" class="btn btn-danger">REMOVE</button></td>
    `;

    let inserted = false;
    for (let row of selectedTableBody.rows) {
        if (parseInt(row.dataset.index) > index) {
            selectedTableBody.insertBefore(newRow, row);
            inserted = true;
            break;
        }
    }

    if (!inserted) {
        selectedTableBody.appendChild(newRow);
    }

    refreshCalculation();
    initNewTooltips();
}


async function removeCharge(button, index) {
    let data = parseInt(index);
    let arr = addedChargeData.filter(value => value !== data);

    if(arr.length > 0) {
        let addedChargeString = JSON.stringify(arr);
        sessionStorage.setItem('addedCharge', addedChargeString);
        addedChargeData = arr;
    } else {
        sessionStorage.removeItem('addedCharge');
        addedChargeData = [];
    }

    let buttonId = 'add-btn-' + index;
    let add_button = document.getElementById(buttonId);
    add_button.disabled = false;

    const row = button.closest('tr');
    row.remove();
    await refreshCalculation();
}

function resetCharge() {
    const add_button = document.querySelectorAll('.add-btn');
    add_button.forEach(function(button) {
        if (button.disabled === true) {
            button.disabled = false;
        }
    });

    // reset the added charge session data
    addedChargeData = [];
    sessionStorage.removeItem('addedCharge');

    const selectedTableBody = document.getElementById('selectedChargeTableBody');
    selectedTableBody.innerHTML = '';
    refreshCalculation();
}

async function refreshCalculation() {
    jailtime_total = 0;
    fine_total = 0;
    bail_total = 0;

    for (let i = 0; i < addedChargeData.length; i++) {
        const data = chargeData[addedChargeData[i]];
        if(data.jailtime > 0) {
            jailtime_total += data.jailtime;
            fine_total += data.fine;
            bail_total += data.bail;
        }
    }
    // Jailtime total
    if(jailtime_total > max_jailtime) jailtime_total = max_jailtime;
    document.getElementById('jailtime-total').textContent = jailtime_total;
    // Fine total
    if(fine_total > max_fine) fine_total = max_fine;
    document.getElementById('fine-total').textContent = `${fine_total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
    // Bail total
    if(bail_total > max_bail) bail_total = max_bail;
    document.getElementById('bail-total').textContent = `${bail_total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;

    // Location tag
    if(jailtime_total > 60) {
        document.getElementById('location-tag').innerHTML = '<span style="cursor: default; word-spacing: 1em;" class="w-100 fs-6 btn btn-info text-bg-info fw-semibold">S A C F</span>';
    } else {
        document.getElementById('location-tag').innerHTML = '';
    }
    
    // Formatting arrest command
    let arrestCommand = `/arrest ${playerName} ${jailtime_total} ${fine_total} ${bail_total}`;
    document.getElementById('arrest-command').textContent = arrestCommand;

    let chargeCodeElement = document.getElementById('charge-code-data');
    if(addedChargeData.length > 0) {
        let totalChargeHTML = `(${addedChargeData.length})`;
        document.getElementById('charge-total').textContent = totalChargeHTML;

        let chargeCodeData = [];
        for (let i = 0; i < addedChargeData.length; i++) {
            let data = chargeData[addedChargeData[i]];
            chargeCodeData.push(data.code);
        }
        let chargeCode = chargeCodeData.join(', ')
        chargeCodeElement.textContent = chargeCode;
        chargeCodeElement.setAttribute("onclick", "copyChargeCode()");
        chargeCodeElement.setAttribute("class", "selectable-text charge-td");
        chargeCodeElement.setAttribute("title", chargeCode);
    } else {
        document.getElementById('charge-total').textContent = '';

        chargeCodeElement.textContent = '';
        chargeCodeElement.removeAttribute("onclick");
        chargeCodeElement.removeAttribute("class");
        chargeCodeElement.removeAttribute("title");
    }

    if (searchChargeIndex.length > 0) {
        if (searchChargeIndex.every(num => addedChargeData.includes(num))) {
            document.getElementById("add-all-btn").disabled = true;
        } else {
            document.getElementById("add-all-btn").disabled = false;
        }
    }
}

function updateName(value) {
    if (typeof value === 'string') {
        playerName = value.replace(/ /g, "_");
    } else {
        playerName = value;
    }
    sessionStorage.setItem('s_playerName', playerName);
    let arrestCommand = `/arrest ${playerName} ${jailtime_total} ${fine_total} ${bail_total}`;
    document.getElementById('arrest-command').textContent = arrestCommand;

}

document.addEventListener('DOMContentLoaded', function () {
    let playerInput = document.getElementById('playerName');

    playerInput.addEventListener('input', function () {
        let inputValue = playerInput.value.trim();
        if(inputValue === "") {
            inputValue = 0;
            sessionStorage.removeItem('s_playerName');
        }
        updateName(inputValue);
    });

    document.getElementById('copyright-date').innerHTML = new Date().getFullYear();
});

// Charge click and copy with /su format
function copyCharge(index) {
    let originalText = document.getElementById(`charge-${index}`);
    let data = chargeData[index];
    let formattedCommand = '';
    
    if(data.jailtime === 0 && data.fine > 0) {
        formattedCommand = `/ticket ${playerName} ${data.fine} ${data.charge}`;
    }
    else {
        formattedCommand = `/su ${playerName} ${data.charge}`;
    }
    
    const tempInput = document.createElement('textarea');
    tempInput.value = formattedCommand;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
        originalText.classList.add('text-secondary-emphasis');
    } catch (err) {
        console.error('Failed to copy text', err);
    }
    document.body.removeChild(tempInput);
}

function copyPureCharge(index) {
    let data = chargeData[index];
    let tempInput = document.createElement('textarea');
    tempInput.value = data.charge;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        alert('Failed to copy text', err);
    }
    document.body.removeChild(tempInput);
}

function copyArrestCMD() {
    let arrestText = document.getElementById('arrest-command').innerText.trim();
    let tempInput = document.createElement('textarea');
    tempInput.value = arrestText;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        alert('Failed to copy text', err);
    }
    document.body.removeChild(tempInput);
}

function copyChargeCode() {
    let arr = [];
    for (let i = 0; i < addedChargeData.length; i++) {
        let data = chargeData[addedChargeData[i]];
        arr.push(data.code);
    }
    let text = arr.join(', ')
    let tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
    } catch(err) {
        alert('Failed to copy text', err);
    }
    document.body.removeChild(tempInput);
}

function splitChargeCode(input) {
    const lastDotIndex = input.lastIndexOf('.');
    if (lastDotIndex !== -1) {
        let partA = input.substring(0, lastDotIndex + 1).trim();
        let partB = input.substring(lastDotIndex + 1).trim();

        const partALastDotIndex = partA.lastIndexOf('.');
        if (partALastDotIndex !== -1) {
            partA = partA.substring(0, partALastDotIndex) + partA.substring(partALastDotIndex + 1);
        }
        return { Code: partA, Charge: partB };
    } else {
        return { Code: '', Charge: input.trim() };
    }
}

function jailtimeInfo(index) {
    let data = chargeData[index];
    if(data.jailtime === 0 && data.fine > 0)
        return '<span class="badge text-bg-secondary mt-2">TICKET</span>';
    else if(data.jailtime === 0 && data.fine === 0)
        return '<span class="badge text-bg-secondary mt-2">TAG</span>';
    else return data.jailtime;
}

function addAllFoundedCharge() {
    if (searchChargeIndex.length > 0) {
        if (searchChargeIndex.every(num => addedChargeData.includes(num))) {
            return;
        }
        for (let i = 0; i < searchChargeIndex.length; i++) {
            if(chargeData[searchChargeIndex[i]] !== null) {
                let arr = parseInt(searchChargeIndex[i]);
                AddCharge(arr);
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const tableFooter = document.getElementById("chargeTableFooter");

    searchInput.addEventListener("input", function () {
        const filter = searchInput.value.toLowerCase().trim();
        let arrData = filter.replace(/\s/g, '').replace(/\./g, '');
        arrData = arrData.split(',');
        arrData = arrData.filter(item=> /^\d/.test(item));

        tableFooter.hidden = true;
        document.getElementById("chargeTable").classList.remove("table-striped");
        searchChargeIndex = [];
        let multiMode = false;

        chargeData.forEach((item, index) => {
            const code = item.code;
            const charge = item.chargeName;
            const chargeRaw = item.charge;

            let row = document.querySelector(`#chargeTableBody tr[data-index="${index}"]`);

            let found = false;
            if(arrData.length > 1) {
                for (let k = 0; k < arrData.length; k++) {
                    if(searchChargeIndex.length >= 20) break;
                    if(arrData[k].toLowerCase() === code.toLowerCase()) {
                        found = true;
                        if (!searchChargeIndex.includes(index)) {
                            searchChargeIndex.push(index);
                        }
                        break;
                    }
                }
            }
            
            if(found) {
                row.hidden = false;
                multiMode = true;
            } else {
                if (
                    code.toLowerCase().indexOf(filter) > -1 ||
                    charge.toLowerCase().indexOf(filter) > -1 || 
                    chargeRaw.toLowerCase().indexOf(filter) > -1
                ) {
                    row.hidden = false;
                } else {
                    row.hidden = true;
                }
            }
        });

        if (multiMode) {
            tableFooter.hidden = false;
            if (searchChargeIndex.every(num => addedChargeData.includes(num))) {
                document.getElementById("add-all-btn").disabled = true;
            } else {
                document.getElementById("add-all-btn").disabled = false;
            }
        }

        if (filter == '') {
            document.getElementById("chargeTable").classList.add("table-striped");
        }
    });
});

function linkHandler(code) {    
    const pattern = /\(1\)\s(A|F|E)/;
    const match = code.match(pattern);
    if(match) return match[0];
    else return code;
}

document.addEventListener('DOMContentLoaded', function () {
    const searchElement = document.getElementById('searchInput');
    const playerNameElement = document.getElementById('playerName');

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey) {
            const key = event.key.toLowerCase();
            if (key === 'k') {
                event.preventDefault();
                searchElement.focus();
            }
            if (key === 's') {
                event.preventDefault();
                playerNameElement.focus();
            }
            if (key === 'enter') {
                if (searchChargeIndex.length > 0) {
                    searchElement.blur();
                    playerNameElement.blur();
                    playerNameElement.scrollIntoView({ behavior: "smooth" });
                    event.preventDefault();
                    addAllFoundedCharge();
                }
            }
            if (key === 'delete') {
                if (document.activeElement != searchElement && document.activeElement != playerNameElement) {
                    event.preventDefault();
                    resetCharge();
                }
            }
        }
    });

    // back to top button handler
    // Show the button when the user scrolls down 100px from the top of the document
    $(window).scroll(function() {
        if ($(this).scrollTop() > 100) {
            $('#back-to-top').fadeIn(200);
        } else {
            $('#back-to-top').fadeOut(200);
        }
    });

    // Scroll to the top when the button is clicked
    $('#back-to-top').click(function() {
        $('html, body').animate({ scrollTop: 0 }, 0);
        return false;
    });


    // Reset button handler
    let 
        resetHoldTimeout
        resetButtonElement = document.getElementById("reset-btn");
    ;
    function startHold() {
        resetHoldTimeout = setTimeout(resetCharge, 300);
    }
    function clearHold() {
        clearTimeout(resetHoldTimeout);
    }
    resetButtonElement.addEventListener("mousedown", startHold);
    resetButtonElement.addEventListener("mouseup", clearHold);
    resetButtonElement.addEventListener("mouseleave", clearHold);
    // Support for mobile/touchscreen
    resetButtonElement.addEventListener("touchstart", startHold);
    resetButtonElement.addEventListener("touchend", clearHold);
    resetButtonElement.addEventListener("touchcancel", clearHold);
});

function initTooltip() {
    // Initialize all tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    // Event listener for all buttons with tooltips
    tooltipTriggerList.forEach(function(element) {
        element.addEventListener('click', function () {
            // Change tooltip title
            let originalTitle = element.getAttribute('data-bs-title');
            if (originalTitle !== 'Click to copy') return;

            element.setAttribute('data-bs-title', 'Copied!');

            // Dispose old tooltip
            let tooltipInstance = bootstrap.Tooltip.getInstance(element);
            tooltipInstance.dispose();

            // Reinitialize tooltip
            tooltipInstance = new bootstrap.Tooltip(element);

            // Show the updated tooltip
            tooltipInstance.show();

            // Set timer to revert tooltip title after 3 seconds
            setTimeout(function () {
            element.setAttribute('data-bs-title', 'Click to copy');
            // Dispose and reinitialize tooltip to update title
            tooltipInstance.dispose();
            tooltipInstance = new bootstrap.Tooltip(element);
            }, 3000);
        });
    });
}

function initNewTooltips() {
    // Select elements that have the tooltip attribute but haven't been initialized
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]:not([data-tooltip-initialized="true"])');
    
    // Initialize the new tooltips
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => {
        // Mark this element as initialized to avoid re-initialization
        tooltipTriggerEl.setAttribute('data-tooltip-initialized', 'true');
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Event listener for new buttons with tooltips
    tooltipTriggerList.forEach(function(element) {
        element.addEventListener('click', function () {
            let originalTitle = element.getAttribute('data-bs-title');
            if (originalTitle !== 'Click to copy') return;

            element.setAttribute('data-bs-title', 'Copied!');

            // Dispose old tooltip
            let tooltipInstance = bootstrap.Tooltip.getInstance(element);
            tooltipInstance.dispose();

            // Reinitialize tooltip
            tooltipInstance = new bootstrap.Tooltip(element);

            // Show the updated tooltip
            tooltipInstance.show();

            // Set timer to revert tooltip title after 3 seconds
            setTimeout(function () {
                element.setAttribute('data-bs-title', 'Click to copy');
                // Dispose and reinitialize tooltip to update title
                tooltipInstance.dispose();
                tooltipInstance = new bootstrap.Tooltip(element);
            }, 3000);
        });
    });
}

const draftData = [
    {
        name: 'Robery Charges',
        code: '1P, 4b, 5K, 8J'
    }, 
];

// Draft system
document.addEventListener('DOMContentLoaded', function () {
    let contentDraft = document.getElementById('draft-content');
    let draftHtml = `
    <input type="radio" class="btn-check" name="draft-list" id="default" autocomplete="off" checked>
    <label class="btn btn-dark" for="default">Default</label>`;

    draftData.forEach((item, index) => {
        if (index < 5) {
        draftHtml += `
            <div class="btn-group" role="group" id="draft-group-${index}">
                <input type="radio" class="btn-check" name="draft-list" id="draft-${index}" autocomplete="off">
                <label class="btn btn-dark" for="draft-${index}">${item.name+' '+'('+(index+1)+')'}</label>

                <button type="button" class="btn btn-dark active dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false" hidden id="draft-dropdown-${index}"></button>
                <ul class="dropdown-menu">
                    <li><button class="dropdown-item btn btn-dark" href="#">Action</button></li>
                    <li><button class="dropdown-item btn btn-dark" href="#">Another action</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item btn btn-danger" href="#">Delete</button></li>
                </ul>
            </div>
        `;
        }
    });

    contentDraft.innerHTML = draftHtml;

    const draftList = document.querySelectorAll('input[name="draft-list"]');

    draftList.forEach(draft => {
        draft.addEventListener('change', function () {
            if (this.checked) {
                document.querySelectorAll('[id^="draft-dropdown-"]').forEach(el => {
                    el.hidden = true;
                })

                let selectedId = this.id;
                let match = selectedId.match(/\d+$/);
                selectedId = match ? match[0] : 'default';
                // console.log('Draft selected ID:', selectedId);

                let input = document.getElementById('searchInput');
                if (selectedId != 'default') {
                    let dropdownId = 'draft-dropdown-' + selectedId;
                    const draftDropdown = document.getElementById(dropdownId);
                    if (draftDropdown) draftDropdown.hidden = false;

                    input.value = draftData[parseInt(selectedId)].code;
                    input.dispatchEvent(new Event('input'));
                } else {
                    input.value = '';
                    input.dispatchEvent(new Event('input'));
                }
            }
        });
    });
});