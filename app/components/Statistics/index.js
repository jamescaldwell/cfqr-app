// @flow
import AutoComplete from 'material-ui/AutoComplete';
import React, { Component, PropTypes } from 'react';
import { connect } from '../../actions';

import AdminLogin from '../Login';
import { INFO_OBJECT_ID, findIntoDatabase } from '../../api/database';
import StatisticsTable from './Table';

const BASE_FILTER = {
  $not: {
    _id: INFO_OBJECT_ID
  }
};

class Statistics extends Component {

  static propTypes = {
    i18n: PropTypes.func,
    auth: PropTypes.bool,
    setFilter: PropTypes.func,
    errorLog: PropTypes.func
  };

  state = {
    data: [],
    dataSource: []
  };

  componentDidMount() {
    this.setSearchValue();
  }

  componentWillReceiveProps(nextProps) {
    const { statistics } = nextProps;
    const { filter, sort } = statistics;
    this.getQuestionnaires(filter, { sort });
  }

  getQuestionnaires(...options) {
    const { errorLog } = this.props;

    return findIntoDatabase(...options)
      .then(questionnaires => {
        const patients = {};
        questionnaires.forEach(qst => {
          if (typeof qst.patient !== 'string' && patients[qst.patient]) {
            return false;
          }
          patients[qst.patient] = qst;
        });
        this.setState({
          data: questionnaires,
          dataSource: Object.keys(patients)
        });
        return true;
      })
      .catch(err => {
        errorLog(err);
      });
  }

  setSearchValue(value) {
    const { setFilter } = this.props;
    const filter = Object.assign({}, BASE_FILTER);
    if (value) {
      filter.patient = { $regex: new RegExp(value) };
    }

    setFilter(filter);
  }

  render() {
    const { i18n, auth } = this.props;
    const { data } = this.state;

    const dataMarkup = (
      <div>
        <AutoComplete
          hintText={i18n('statistics-filter-patient-hint')}
          floatingLabelText={i18n('statistics-filter-patient-label')}
          floatingLabelFixed={true}
          defaultValue=""
          dataSource={this.state.dataSource}
          onChange={(e, value) => this.setSearchValue(value)}
        />
        <StatisticsTable rowUrl="questionnaire" urlId="_id" rows={data} />
      </div>
    );

    return (
      (!auth) ? <AdminLogin /> : dataMarkup
    );
  }
}

export default connect(Statistics);
