package models.user

import models.utils.MyPostgresDriver.api._
import play.api.Play.current
import java.sql.Timestamp
import models.survey._
import models.daos.slick.DBTableDefinitions.{DBUser, UserTable}

import play.api.Play
import play.api.db.slick.DatabaseConfigProvider
import slick.driver.JdbcProfile
import scala.concurrent.Future

import slick.lifted.ForeignKeyQuery

case class UserSurveyOptionSubmission(userSurveyOptionSubmissionId: Int, userId: String, surveyQuestionId: Int, surveyOptionId: Option[Int], timeSubmitted: Timestamp, numMissionsCompleted: Int)

class UserSurveyOptionSubmissionTable(tag: Tag) extends Table[UserSurveyOptionSubmission](tag, Some("sidewalk"), "user_survey_option_submission") {
  def userSurveyOptionSubmissionId = column[Int]("user_survey_option_submission_id", O.PrimaryKey, O.AutoInc)
  def userId = column[String]("user_id")
  def surveyQuestionId = column[Int]("survey_question_id")
  def surveyOptionId = column[Option[Int]]("survey_option_id")
  def timeSubmitted = column[Timestamp]("time_submitted")
  def numMissionsCompleted = column[Int]("num_missions_completed")

  def * = (userSurveyOptionSubmissionId, userId, surveyQuestionId, surveyOptionId, timeSubmitted, numMissionsCompleted) <> ((UserSurveyOptionSubmission.apply _).tupled, UserSurveyOptionSubmission.unapply)

  def user: ForeignKeyQuery[UserTable, DBUser] =
    foreignKey("user_survey_option_submission_user_id_fkey", userId, TableQuery[UserTable])(_.userId)
  def survey_question: ForeignKeyQuery[SurveyQuestionTable, SurveyQuestion] =
    foreignKey("user_survey_option_submission_survey_question_id_fkey", surveyQuestionId, TableQuery[SurveyQuestionTable])(_.surveyQuestionId)
}

object UserSurveyOptionSubmissionTable{
  val db = play.api.db.slick.DB
  val userSurveyOptionSubmissions = TableQuery[UserSurveyOptionSubmissionTable]

  def save(userSurveyOptionSubmission: UserSurveyOptionSubmission): Int = db.withTransaction { implicit session =>
    val userSurveyOptionSubmissionId: Int =
      (userSurveyOptionSubmissions returning userSurveyOptionSubmissions.map(_.userSurveyOptionSubmissionId)) += userSurveyOptionSubmission
    userSurveyOptionSubmissionId
  }

}