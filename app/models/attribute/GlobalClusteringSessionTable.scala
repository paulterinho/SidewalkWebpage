package models.attribute

/**
  * Created by misaugstad on 4/27/17.
  */

import models.region.{Region, RegionTable}
import models.utils.MyPostgresDriver.api._
import play.api.Play.current
import play.api.db.slick

import play.api.Play
import play.api.db.slick.DatabaseConfigProvider
import slick.driver.JdbcProfile
import scala.concurrent.Future

import slick.lifted.{ForeignKeyQuery, ProvenShape}
import scala.language.postfixOps

case class GlobalClusteringSession(globalClusteringSessionId: Int, regionId: Int, timeCreated: java.sql.Timestamp)


class GlobalClusteringSessionTable(tag: Tag) extends Table[GlobalClusteringSession](tag, Some("sidewalk"), "global_clustering_session") {
  def globalClusteringSessionId: Rep[Int] = column[Int]("global_clustering_session_id", O.PrimaryKey, O.AutoInc)
  def regionId: Rep[Int] = column[Int]("region_id")
  def timeCreated: Rep[java.sql.Timestamp] = column[java.sql.Timestamp]("time_created")

  def * : ProvenShape[GlobalClusteringSession] = (globalClusteringSessionId, regionId, timeCreated) <>
    ((GlobalClusteringSession.apply _).tupled, GlobalClusteringSession.unapply)

  def region: ForeignKeyQuery[RegionTable, Region] =
    foreignKey("global_clustering_session_region_id_fkey", regionId, TableQuery[RegionTable])(_.regionId)
}

/**
  * Data access object for the GlobalClusteringSessionTable table
  */
object GlobalClusteringSessionTable {
  val db: slick.Database = play.api.db.slick.DB
  val globalClusteringSessions: TableQuery[GlobalClusteringSessionTable] = TableQuery[GlobalClusteringSessionTable]

  def getAllGlobalClusteringSessions: List[GlobalClusteringSession] = db.withTransaction { implicit session =>
    globalClusteringSessions.list
  }

  /**
    * Truncates global_clustering_session, global_attribute, and global_attribute_user_attribute.
    */
  def truncateTables(): Unit = db.withTransaction { implicit session =>
    Q.updateNA("TRUNCATE TABLE global_clustering_session CASCADE").execute
  }

  def save(newSess: GlobalClusteringSession): Int = db.withTransaction { implicit session =>
    val newId: Int = (globalClusteringSessions returning globalClusteringSessions.map(_.globalClusteringSessionId)) += newSess
    newId
  }
}
