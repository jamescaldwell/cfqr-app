// @flow
import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import { List, ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import FontIcon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import Toggle from 'material-ui/Toggle';
import { cyan700 } from 'material-ui/styles/colors';

import { connect } from '../../../actions';
import { findOneIntoDatabase, insertIntoDatabase } from '../../../api/database';
import { saveUserQuestionnaire } from '../../../api/backup';
import { getIdFromHash } from '../../../utils/misc';

import AdminLogin from '../../Login';
import StatisticsPatientInfo from '../Patient/Info';
import StatisticsQuestionnaireAnswers from './Answers';
import StatisticsQuestionnaireScore from './Score';
import StatisticsQuestionnaireChart from './Chart';
import Print from '../../Print';
import SaveAs from '../../SaveAs';

import { format as dateFormat } from '../../../config/date.json';

class StatisticsQuestionnaire extends Component {

  static propTypes = {
    i18n: PropTypes.func,
    errorLog: PropTypes.func,
    auth: PropTypes.bool,
    locale: PropTypes.string
  };

  state = {
    debug: false,
    data: {}
  };

  componentWillReceiveProps() {
    // ugly, params are not available
    this.getQuestionnaire();
  }

  getQuestionnaire() {
    const { errorLog } = this.props;
    const id = getIdFromHash();

    findOneIntoDatabase({ _id: id })
      .then(result => {
        this.setState({ data: result });
        return true;
      })
      .catch(err => {
        errorLog(err);
      });
  }

  changePatient(patient) {
    const { errorLog } = this.props;
    const questionnaire = this.state.data;
    questionnaire.patient = patient;
    insertIntoDatabase(questionnaire)
      .then(() => saveUserQuestionnaire(questionnaire))
      .then(() => {
        this.setState({ data: questionnaire });
        return true;
      })
      .catch(err => {
        errorLog(err);
      });
  }

  renderQuestionnaireInfo(key, answer) {
    const { i18n, locale } = this.props;

    switch (key) {
      case 'createdAt':
        return (
          <ListItem
            className="statistics__element"
            key={`statistics-questionnaire-${key}`}
            disabled={true}
          >
            <strong>{i18n(`statistics-questionnaire-${key}`)}: </strong>
            {new global.Intl
              .DateTimeFormat(locale, dateFormat.full)
              .format(answer)}
          </ListItem>
        );
      case 'type':
        return (
          <ListItem
            className="statistics__element"
            key={`statistics-questionnaire-${key}`}
            disabled={true}
          >
            <strong>{i18n(`statistics-questionnaire-${key}`)}: </strong>
            {i18n(answer)}
          </ListItem>
        );
      default:
        return '';
    }
  }

  renderQuestionnaireDebug(key, answer) {
    const { locale } = this.props;

    switch (key) {
      case 'updatedAt':
        return (
          <ListItem
            className="statistics__element"
            key={`statistics-questionnaire-${key}`}
            disabled={true}
          >
            <strong>{key}: </strong>
            {new global.Intl
              .DateTimeFormat(locale, dateFormat.full)
              .format(answer)}
          </ListItem>
        );
      case '_id':
      case 'appVersion':
      case 'dataVersion':
        return (
          <ListItem
            className="statistics__element"
            key={`statistics-questionnaire-${key}`}
            disabled={true}
          >
            <strong>{key}: </strong>
            {answer}
          </ListItem>
        );
      default:
        return '';
    }
  }

  render() {
    const { auth, i18n, locale } = this.props;
    const { data } = this.state;
    if (!data) {
      return (<div />);
    }
    if (!data._id) {
      this.getQuestionnaire();
    }

    const exportPatient = data.patient ? data.patient : 'unknown';
    const exportType = data.type ? data.type : '';
    const exportDate = data.createdAt ? new global.Intl
      .DateTimeFormat(locale, dateFormat.date)
      .format(data.createdAt) : '';

    return (
      (!auth) ? <AdminLogin /> : <div>
        <List>
          <Print style={{ float: 'right' }} />
          <SaveAs
            exportData={[data]}
            fileName={`cfqr-app-patient-${exportPatient}-${exportType}-${exportDate}`}
            style={{ float: 'right' }}
          />
          <Subheader>{i18n('statistics-questionnaire-info')}</Subheader>
          {Object.keys(data).map(key => this.renderQuestionnaireInfo(
            key,
            data[key]))}
        </List>
        <Divider />
        <StatisticsPatientInfo changePatient={this.changePatient.bind(this)} questionnaireData={data} />
        {data.patient ?
          <FlatButton
            containerElement={<Link
              className="statistics__patient-link no-print"
              to={`/statistics/patient/${data.patient}`}
              style={{ color: cyan700 }}
            >{i18n('statistics-patient-click-here')}</Link>}
            label={i18n('statistics-patient-view-information')}
            labelPosition="before"
            primary={true}
            icon={<FontIcon color={cyan700} className="material-icons">folder_shared</FontIcon>}
          /> : ''}
        <Divider />
        <StatisticsQuestionnaireChart questionnaireData={data} />
        <StatisticsQuestionnaireScore questionnaireData={data} />
        <Divider />
        <StatisticsQuestionnaireAnswers questionnaireData={data} />
        <div className="no-print" style={{ maxWidth: 150, marginTop: '1rem' }}>
          <Toggle
            label="Debug"
            defaultToggled={this.state.debug}
            onToggle={() => {
              this.setState({
                debug: !this.state.debug
              });
            }}
          />
        </div>
        {this.state.debug ? <List>
          {Object.keys(data).map(key => this.renderQuestionnaireDebug(
            key,
            data[key]))}
          <ListItem
            className="statistics__element"
            key="statistics-questionnaire-debug-object"
            disabled={true}
          >
            <strong>Debug object</strong>
            <br /><br />
            <i>
              {JSON.stringify(data)}
            </i>
          </ListItem>
        </List>
        : ''}
      </div>
    );
  }
}

export default connect(StatisticsQuestionnaire);
