class Calculator extends HTMLElement {
    constructor(data) {
        super();
        this.saved = data;
        this.attachShadow({mode: 'open'}).innerHTML = `
        <link rel="stylesheet" href="/common.css">
        <link rel="stylesheet" href="calculator.css">
        <menu>
            <li><button id="add" class="action">➕</button>
            <li><input type="text" name="name">
            <li><button id="delete" class="action">🗑️</button>
        </menu>
        <form id="stats">
            <div>
                <b><span>Normal</span><span>普通攻擊</span></b>
                <input type="checkbox" id="toggle"><label for="toggle"></label>
                <b><span>Special</span><span>必殺攻擊</span></b>
            </div>
            <label>
                <span>Monster Level</span><span>怪物等級</span> <input name="monsterLv" placeholder="85+">
            </label>
            <label>
                <span>Taint debuff</span><span>侵蝕減益</span> <input name="TD" step=".01" placeholder="Leave empty if no">
            </label>
            <label>
                <span>Charcter level</span><span>角色等級</span> <input name="Lv" placeholder="85">
            </label>
            <label class="icon">
                <span>Attack</span><span>攻擊力</span> <input name="A" placeholder="28469">
            </label>
            <data id="A"></data>
            <label class="icon special">
                <span>Special attack</span><span>必殺攻擊力</span> <input name="SA" placeholder="6748">
            </label>             
            <label class="icon">
                <span>Critical chance</span><span>暴擊機率</span> <input name="CAC" step=".01" placeholder="96.21">
            </label>
            <data id="CAC"></data>
            <label class="icon">
                <span>Critical damage</span><span>暴擊傷害</span> <input name="CAD" step=".01" placeholder="736.04">
            </label>
            <data id="CAD"></data>
            <label class="icon normal">
                <span>Hell spear chance</span><span>地獄之矛機率</span> <input name="HSC" step=".01" min="10" placeholder="10">
            </label>
            <label class="icon normal">
                <span>Hell spear damage</span></span>地獄之矛傷害</span> <input name="HS" placeholder="440">
            </label>
            <data id="HS" class="normal"></data>
            <label class="icon">
                <span>Taint resistance</span><span>侵蝕抗性</span> <input name="TR" step=".01" placeholder="27.67">
            </label>
            <label class="normal">>
                <a href="https://docs.google.com/spreadsheets/d/1FGxKHQuwz_Jx-GdYd6647FiAE9UbS6mZgufXor9_DZk" target="_blank"><span>Skill coefficient</span><span>技能傷害係數</span></a>
                <input name="skill" class="normal" step=".01" placeholder="4.55">
            </label>
            <label class="special">
                <a href="https://docs.google.com/spreadsheets/d/1FGxKHQuwz_Jx-GdYd6647FiAE9UbS6mZgufXor9_DZk" target="_blank"><span>Skill coefficient</span><span>技能傷害係數</span></a>
                <input name="skill" class="special" step=".01" placeholder="113.4">
            </label>
        </form>
        <form id="buffs">
            <fieldset id="chase">
                <label>
                    <span>All damage</span><span>全部傷害</span>
                    <img src="buffs/cp1.png"><input id="cp-all" max="50"><data>0.15</data>
                </label>
                <label class="special">
                    <span>Special damage</span><span>必殺傷害</span>
                    <img src="buffs/cp2.png"><input id="cp-special" max="100"><data>0.2</data>
                </label>
                <label>
                    <span>Boss damage</span><span>Boss 傷害</span>
                    <img src="buffs/cp3.png"><input id="cp-boss" max="50"><data>0.25</data>
                </label>
            </fieldset>
            <fieldset id="title"></fieldset>
            <fieldset id="item"></fieldset>
            <fieldset id="rune"></fieldset>
        </form>
        <ul>
            <li><prop-icon prop="CAD" no></prop-icon><prop-icon prop="HS" no></prop-icon><output></output>
            <li class="normal"><prop-icon prop="CAD" no></prop-icon><prop-icon prop="HS"></prop-icon><output></output>
            <li><prop-icon prop="CAD"></prop-icon><prop-icon prop="HS" no></prop-icon><output></output>
            <li class="normal"><prop-icon prop="CAD"></prop-icon><prop-icon prop="HS"></prop-icon><output></output>
            <li><span>Average</span><output></output>
        </ul>`;
    }
    connectedCallback() {
        this.build();
        this.events();
        this.shadowRoot.Q('input:not([type])', input => {
            input.type = 'number', input.min ||= 0;
            input.parentElement.matches('.icon') && input.labels[0].before(E('prop-icon', {prop: input.name, classList: input.parentElement.classList}));
        });
        this.saved ? this.fill() : this.shadowRoot.Q('input[name=name]').value = `Profile ${[...this.parentElement.children].indexOf(this) + 1}`;
        this.shadowRoot.Q('#toggle').dispatchEvent(new InputEvent('change'));
    }
    trigger = () => this.shadowRoot.Q('#stats').dispatchEvent(new InputEvent('change'));
    build = () => ['rune','item','title'].forEach(what => this.shadowRoot.Q(`#${what}`).append(...Calculator[what]()));
    events = () => {
        this.shadowRoot.Q('#toggle').onchange = ev => {
            this.mode = this.classList = ev.target.checked ? 'special' : 'normal';
            this.trigger();
        };
        this.shadowRoot.Q('input[type=radio]+label', label => label.onclick = () => {
            let input = label.previousSibling;
            if (!input.checked) return;
            input.checked = false;
            input.dispatchEvent(new InputEvent('change', {bubbles: true}));
            return false;            
        });
        this.shadowRoot.Q('form', form => form.onchange = () => {
            this.add.debuff();
            this.add.buff();
            let damage = Damage({...this.read.stat(), buff: this.read.buff()}, this.mode == 'normal');
            [damage.basic, damage.basic + damage.HS, damage.critical, damage.critical + damage.HS, damage.average]
                .forEach((value, i) => this.shadowRoot.Q(`li:nth-of-type(${i+1}) output`).value = value.toFixed(0));
            setTimeout(() => this.save());
        });
        this.shadowRoot.Q('#add').onclick = () => Calculator.add();
        this.shadowRoot.Q('#delete').onclick = () => this.delete();
    }
    read = {
        stat: () => this.shadowRoot.Q(`#stats :is(input,select):not(.${this.mode == 'normal' ? 'special' : 'normal'})`)
            .reduce((obj, input) => ({...obj, [input.name]: parseFloat(input.value || input.placeholder)}), {}),
        buff: () => ['A','CAC','HS'].reduce((obj, prop) => ({...obj, [prop]: parseFloat(this.shadowRoot.Q(`#${prop}`).value || 0)}), {}),
    }
    add = {
        buff: () => {
            let buffs = [...this.shadowRoot.querySelectorAll('fieldset input:checked')]
                .reduce((sum, input) => sum.add(JSON.parse(input.value)), new Stats(Stats.zero()));
            buffs.A += this.add.points('cp-all') + this.add.points('cp-boss') + (this.mode == 'normal' ? 0 : this.add.points('cp-special'));
            let buffed = [...this.shadowRoot.querySelectorAll('data[id][value]')].map(data => data.id);
            Object.entries(buffs).forEach(([p, v]) => (buffed.includes(p) || v) && (this.shadowRoot.Q(`#${p}`).value = p == 'A' ? v.toFixed(2) : v));
        },
        points: which => {
            let input = this.shadowRoot.Q(`#${which}`);
            return parseFloat(input.value || 0) * parseFloat(input.nextElementSibling.textContent);
        },
        debuff: () => {
            let TD = this.shadowRoot.Q('input[name=TD]').value;
            this.shadowRoot.Q('#CAC,#CAD', data => data.classList.toggle('TD', TD != ''));
        }
    }
    save() {
        let stats = [...this.shadowRoot.Q('#stats input[type=number]')].reduce((obj, input) => ({...obj, [input.name]: input.value}), {});
        ['normal','special'].forEach(s => stats[`skill.${s}`] = this.shadowRoot.Q(`#stats input[name=skill].${s}`).value);
        let buffs = [...this.shadowRoot.querySelectorAll('#buffs input:checked')].map(input => input.id);
        buffs = this.shadowRoot.Q('#buffs input[type=number]').reduce((obj, input) => ({...obj, [input.id]: input.value}), buffs);
        let data = {stats, buffs, name: this.shadowRoot.Q('input[name=name]').value};
        DB.put('damage', this.id ? [parseInt(this.id), data] : data).then(ev => this.id = ev.target.result).catch(console.error);
    }
    fill() {
        this.id = this.saved.id;
        this.shadowRoot.Q('input[name=name]').value = this.saved.name;
        Object.entries(this.saved.stats).forEach(([name, value]) => name.includes('.') ?
            this.shadowRoot.Q(`#stats input[name=${name.split('.')[0]}].${name.split('.')[1]}`).value = value :
            this.shadowRoot.Q(`#stats input[name=${name}]`).value = value
        );
        Object.entries(this.saved.buffs).forEach(([id, value]) => /^\d+/.test(id) ? 
            this.shadowRoot.Q(`#${value}`).checked = true : 
            this.shadowRoot.Q(`#${id}`).value = value
        );
    }
    delete() {
        (this.id ? DB.delete('damage', parseInt(this.id)) : Promise.resolve()).then(() => this.remove());
    }
}
Object.assign(Calculator, {
    build: (name, type, src) => 
        Object.entries(Buff[name]).map(([id, value]) => [
            E('input', {id, type, ...type ? {name} : {}, value: JSON.stringify(value)}), 
            E('label', [E('img', {src: src(id)})], {htmlFor: id})
        ]).flat(),
    rune: () => Calculator.build('rune', 'checkbox', id => `/rune/set/${id.split('-')[0]}.webp`),
    item: () => Calculator.build('item', 'checkbox', id => `buffs/${id}.png`),
    title: () => Calculator.build('title', 'radio', id => `buffs/${id}.webp`),

    add: data => {
        typeof data == 'boolean' && (data = null);
        Q('main').appendChild(new Calculator(data))[data ? null : 'scrollIntoView']?.();
    }
});
customElements.define('damage-calculator', Calculator);
