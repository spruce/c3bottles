const $ = require('jquery');
const gettext = require('./gettext');
const modals = require('./modals');

require('../common/refresh');

const datatablesInit = require('datatables.net-bs4').default;
datatablesInit(window, $);

const levelConfig = $.parseJSON($('meta[name=map-source]').attr('content')).level_config;
const offset = $("meta[name='time']").attr('content') - Date.now() / 1000;
const states = $.parseJSON($('meta[name=state-labels]').attr('content'));

const icon_details = $('<i></i>')
  .addClass('clickable fas fa-search dp_modal details')
  .attr('title', gettext('Details'));
const icon_report = $('<span></span>')
  .addClass('clickable fas fa-bullhorn dp_modal report')
  .attr('title', gettext('Report'));
const icon_visit = $('<i></i>').addClass('clickable fas fa-wrench dp_modal visit').attr('title', gettext('Visit'));

let dt;
let category = -1;

function getTableData() {
  const arr = [];

  for (const num in drop_points) {
    if (!drop_points[num].removed && (category < 0 || drop_points[num].category_id === category)) {
      arr.push(drop_points[num]);
    }
  }

  return arr;
}

function setCategory(num) {
  category = num;
  $('.list-category-select-button').removeClass('btn-primary').addClass('btn-light');
  $('.list-category-select-button')
    .filter(`[data-category_id='${num}']`)
    .removeClass('btn-light')
    .addClass('btn-primary');
  dt.clear();
  dt.rows.add(getTableData());
  dt.draw(true);
}

module.exports.setCategory = setCategory;

function redrawTable() {
  dt.rows().invalidate().draw(false);
  setTimeout(() => {
    redrawTable();
  }, 10000);
}

module.exports.initializeTable = function () {
  let columns = [
    {
      data: 'number',
    },
    {
      data: 'category',
    },
    {
      data: 'description_with_level',
    },
  ];

  if (levelConfig) {
    columns.push({
      data: 'level',
    });
  }
  columns = columns.concat([
    {
      data: null,
      render(data, type) {
        if (type === 'sort') {
          return labels[data.last_state].num;
        }

        return $('<span/>')
          .addClass('badge')
          .addClass(`badge-${states[data.last_state].badge_class}`)
          .text(states[data.last_state].description)
          .prop('outerHTML');
      },
    },
    {
      data: null,
      sort: 'desc',
      className: 'hidden-xs',
      render(data) {
        const prio = (Date.now() / 1000 + offset - data.base_time) * data.priority_factor;

        drop_points[data.number].priority = prio.toFixed(2);

        return prio.toFixed(2);
      },
    },
    {
      data: 'reports_new',
      className: 'hidden-xs',
    },
    {
      data: null,
      orderable: false,
      defaultContent: '',
      createdCell(td, cd, rd) {
        rd.details_cell = td;
      },
      render(data) {
        const my_icon = icon_details.clone();

        my_icon.click(() => {
          modals.show(data.number, 'details');
        });
        $(data.details_cell).empty().append(my_icon);
      },
    },
    {
      data: null,
      orderable: false,
      defaultContent: '',
      createdCell(td, cd, rd) {
        rd.report_cell = td;
      },
      render(data) {
        const my_icon = icon_report.clone();

        my_icon.click(() => {
          modals.show(data.number, 'report');
        });
        $(data.report_cell).empty().append(my_icon);
      },
    },
    {
      data: null,
      orderable: false,
      defaultContent: '',
      createdCell(td, cd, rd) {
        rd.visit_cell = td;
      },
      render(data) {
        const my_icon = icon_visit.clone();

        my_icon.click(() => {
          modals.show(data.number, 'visit');
        });
        $(data.visit_cell).empty().append(my_icon);
      },
    },
  ]);

  dt = $('#dp_list').DataTable({
    language: gettext('dt'),
    paging: false,
    data: getTableData(),
    order: [[5, 'desc']],
    createdRow(row, data) {
      drop_points[data.number].row = row;
    },
    columns,
  });

  setTimeout(() => {
    redrawTable();
  }, 10000);
};

module.exports.drawRow = function (num) {
  if (drop_points[num] && drop_points[num].row) {
    dt.row(drop_points[num].row).data(drop_points[num]).draw(false);
  } else if (drop_points[num]) {
    dt.row.add(drop_points[num]).draw(false);
  }
};

module.exports.isInitialized = function () {
  return dt !== undefined;
};

$('.list-category-select-button').on('click', (ev) => {
  const num = $(ev.currentTarget).data('category_id');

  if (num > -1) {
    location.hash = `#${num}`;
  } else {
    location.hash = '';
  }
  setCategory(num);
});
