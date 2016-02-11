package models

import java.sql.Timestamp
import java.util.{Calendar, Date}

import models.audit._
import org.specs2.mutable._
import play.api.db.slick.DB
// import play.api.db.slick.Config.driver.simple._
import models.utils.MyPostgresDriver.simple._
import play.api.test._

/**
  * An example from:
  * http://www.typesafe.com/activator/template/play-slick-quickstart
  */
class AuditTaskSpec extends Specification {
  "DB" should {
    "work as expected" in new WithApplication {
      val auditTasks = TableQuery[AuditTaskTable]

      DB.withTransaction { implicit s: Session =>
        val calendar: Calendar = Calendar.getInstance
        val now: Date = calendar.getTime
        val currentTimestamp: Timestamp = new Timestamp(now.getTime)
        val task = AuditTask(-2, Some(-2), "11c961e3-7181-49e6-94da-5dec3687536c", 1, currentTimestamp, Some(currentTimestamp))

        auditTasks.insert(task)

        val filtered = auditTasks.filter(_.amtAssignmentId.getOrElse(-1) === -2).list
        filtered.length shouldEqual 1

        s.rollback
      }
    }
  }
}