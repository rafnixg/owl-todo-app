(function () {
  const { Component, Store } = owl;
  const { xml } = owl.tags;
  const { whenReady } = owl.utils;
  const { useRef, useDispatch, useState, useStore } = owl.hooks;

  const actions = {
    addTask({ state }, title) {
      title = title.trim();
      if (title) {
        const task = {
          id: state.nextId++,
          title: title,
          isCompleted: false,
        };
        state.tasks.push(task);
      }
    },
    toggleTask({ state }, id) {
      const task = state.tasks.find((t) => t.id === id);
      task.isCompleted = !task.isCompleted;
    },
    deleteTask({ state }, id) {
      const index = state.tasks.findIndex((t) => t.id === id);
      state.tasks.splice(index, 1);
    },
  };

  const initialState = {
    nextId: 1,
    tasks: [],
  };

  const TASK_TEMPLATE = xml`
      <div class="task" t-att-class="props.task.isCompleted ? 'done' : ''">
          <input type="checkbox" t-att-checked="props.task.isCompleted"
              t-att-id="props.task.id"
              t-on-click="dispatch('toggleTask', props.task.id)"/>
          <label t-att-for="props.task.id"><t t-esc="props.task.title"/></label>
          <span class="delete" t-on-click="dispatch('deleteTask', props.task.id)">🗑</span>
      </div>`;

  class Task extends Component {
    static template = TASK_TEMPLATE;
    static props = ["task"];
    dispatch = useDispatch();
  }

  const APP_TEMPLATE = xml`
      <div class="todo-app">
          <input placeholder="Enter a new task" t-on-keyup="addTask" t-ref="add-input"/>
          <div class="task-list">
              <Task t-foreach="displayedTasks" t-as="task" t-key="task.id" task="task"/>
          </div>
          <div class="task-panel" t-if="tasks.length">
              <div class="task-counter">
                  <t t-esc="displayedTasks.length"/>
                  <t t-if="displayedTasks.length lt tasks.length">
                      / <t t-esc="tasks.length"/>
                  </t>
                  task(s)
              </div>
              <div>
                  <span t-foreach="['all', 'active', 'completed']"
                      t-as="f" t-key="f"
                      t-att-class="{active: filter.value===f}"
                      t-on-click="setFilter(f)"
                      t-esc="f"/>
              </div>
          </div>
      </div>`;

  class App extends Component {
    static template = APP_TEMPLATE;
    static components = { Task };

    inputRef = useRef("add-input");
    tasks = useStore((state) => state.tasks);
    filter = useState({ value: "all" });
    dispatch = useDispatch();

    mounted() {
      this.inputRef.el.focus();
    }

    addTask(ev) {
      // 13 is keycode for ENTER
      if (ev.keyCode === 13) {
        this.dispatch("addTask", ev.target.value);
        ev.target.value = "";
      }
    }

    get displayedTasks() {
      switch (this.filter.value) {
        case "active":
          return this.tasks.filter((t) => !t.isCompleted);
        case "completed":
          return this.tasks.filter((t) => t.isCompleted);
        case "all":
          return this.tasks;
      }
    }
    setFilter(filter) {
      this.filter.value = filter;
    }
  }

  function makeStore() {
    const localState = window.localStorage.getItem("todoapp");
    const state = localState ? JSON.parse(localState) : initialState;
    const store = new Store({ state, actions });
    store.on("update", null, () => {
      localStorage.setItem("todoapp", JSON.stringify(store.state));
    });
    return store;
  }

  function setup() {
    owl.config.mode = "dev";
    App.env.store = makeStore();
    const app = new App();
    app.mount(document.body);
  }

  whenReady(setup);
})();
